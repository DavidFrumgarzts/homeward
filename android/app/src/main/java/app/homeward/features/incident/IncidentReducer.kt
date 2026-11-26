package app.homeward.features.incident

import app.homeward.features.incident.IncidentEffect.*
import app.homeward.features.incident.IncidentEvent.*
import app.homeward.features.incident.contracts.ActivationMethod
import app.homeward.features.incident.contracts.IncidentInput
import app.homeward.features.incident.contracts.IncidentPhase.*
import app.homeward.features.incident.contracts.LocationFix

// PURE LOGIC: the incident state machine. (state, event, time) -> new state + what the engine must do.
//   Inactive -> SafetyCheckRequested -> SosActive -> Resolved, and Inactive -> SosActive for confirmed triggers.
// No Android, no AI, no clock of its own: time is passed in. Every edge is tested in IncidentReducerTest
// and in shared/test-vectors/incident-machine.json (the same cases run on iOS).
// Only she can stand an alert down: nothing here lets a model or a timer cancel a check or an SOS.
object IncidentReducer {
    data class Result(val state: IncidentState, val effects: List<IncidentEffect> = emptyList())

    fun reduce(state: IncidentState, event: IncidentEvent, now: Long): Result = when (event) {
        is StartSos -> if (state.phase == SosActive) Result(state) else startSos(state, event.input, now)
        is RaiseSafetyCheck -> raiseCheck(state, event, now)
        is AnswerSafetyCheck -> answerCheck(state, event.ok, now)
        Tick -> tick(state, now)
        is Describe -> if (state.phase != SosActive) Result(state) else {
            val rewrite = event.text.isNotBlank() && !state.messageEdited
            val next = state.copy(description = event.text, situation = SituationPicker.pick(event.text), writing = rewrite)
            Result(if (state.messageEdited) next else next.copy(message = event.plainMessage, messageRanOnDevice = null), if (rewrite) listOf(WriteMessage(event.text)) else emptyList())
        }
        is MessageWritten -> when {
            state.phase != SosActive || event.forDescription != state.description -> Result(state) // a late answer for older words
            state.messageEdited -> Result(state.copy(writing = false))
            else -> Result(state.copy(message = event.message, messageRanOnDevice = event.ranOnDevice, writing = false))
        }
        is EditMessage -> if (state.phase != SosActive) Result(state) else Result(state.copy(message = event.text, messageEdited = true, writing = false))
        is Send -> if (state.phase != SosActive || event.message.isBlank()) Result(state) else Result(
            state.copy(message = event.message, alertSent = true, writing = false, lastSentFix = state.lastFix, lastSentAtMillis = now, pointsHeld = 0),
            listOf(SendAlert(event.message)),
        )
        is Delivery -> if (state.phase == Inactive) Result(state) else
            Result(state.copy(deliveries = state.deliveries.filterNot { it.contactName == event.delivery.contactName } + event.delivery))
        is UpdateConfirmed -> if (state.phase == Inactive) Result(state) else Result(state.copy(lastUpdateConfirmedAtMillis = event.atMillis))
        is Location -> location(state, event, now)
        is Signal -> Result(state.copy(canSend = event.canSend), if (event.canSend && !state.canSend) listOf(FlushOutbox) else emptyList())
        is Battery -> if (state.phase == SosActive && state.alertSent && event.percent < LOW_BATTERY && !state.batteryLowSent)
            Result(state.copy(batteryLowSent = true), listOf(SendBatteryLow(state.lastFix))) else Result(state)
        ImOk -> when (state.phase) {
            SosActive -> Result(state.copy(phase = Resolved, endedAtMillis = now, writing = false), listOfNotNull(SendEnded.takeIf { state.alertSent }, StopSession))
            SafetyCheckRequested -> answerCheck(state, ok = true, now)
            else -> Result(state)
        }
        Cancel -> if (state.phase == SosActive && !state.alertSent) Result(cleared(state), listOf(StopSession)) else Result(state)
        Reset -> if (state.phase == Resolved) Result(cleared(state)) else Result(state)
    }

    const val LOW_BATTERY = 15

    private fun cleared(state: IncidentState) = IncidentState(canSend = state.canSend)

    // A confirmed trigger: she is in the SOS and writes the message herself. An unconfirmed one
    // (she never answered) sends the fixed automatic alert straight away.
    private fun startSos(state: IncidentState, input: IncidentInput, now: Long, trail: List<LocationFix> = listOfNotNull(input.location)): Result {
        val active = IncidentState(
            phase = SosActive, input = input, description = input.description, situation = SituationPicker.pick(input.description),
            trail = trail, canSend = state.canSend,
        )
        return if (input.userConfirmed) Result(active, listOf(StartSession))
        else Result(active.copy(alertSent = true, lastSentFix = active.lastFix, lastSentAtMillis = now), listOf(StartSession, SendAutoAlert))
    }

    private fun raiseCheck(state: IncidentState, event: RaiseSafetyCheck, now: Long): Result = when {
        state.phase == Inactive -> Result(
            IncidentState(phase = SafetyCheckRequested, input = event.input, trail = listOfNotNull(event.input.location), canSend = state.canSend, check = check(event.urgent, now)),
            listOf(AskSafetyCheck(event.urgent)),
        )
        // A quiet check is already showing and things got worse: make it urgent, with a fresh, shorter countdown.
        state.phase == SafetyCheckRequested && state.check?.urgent == false && event.urgent ->
            Result(state.copy(input = event.input, check = check(urgent = true, now, repeated = state.check.repeated)), listOf(AskSafetyCheck(true)))
        else -> Result(state)
    }

    private fun check(urgent: Boolean, now: Long, repeated: Boolean = false) =
        SafetyCheck(urgent, now + if (urgent) SafetyCheck.URGENT_MILLIS else SafetyCheck.QUIET_MILLIS, repeated)

    private fun answerCheck(state: IncidentState, ok: Boolean, now: Long): Result {
        val input = state.input
        if (state.phase != SafetyCheckRequested || input == null) return Result(state)
        if (ok) return Result(cleared(state), listOf(ClearSafetyCheck))
        val started = startSos(state, input.copy(method = ActivationMethod.SafetyCheckEscalation, userConfirmed = true), now, state.trail)
        return Result(started.state, listOf(ClearSafetyCheck) + started.effects)
    }

    private fun tick(state: IncidentState, now: Long): Result {
        val check = state.check
        val input = state.input
        if (state.phase == SafetyCheckRequested && check != null && input != null && now >= check.deadlineMillis) {
            // No answer to a quiet check: ask once more, urgently. No answer to an urgent one: raise the SOS for her.
            if (!check.urgent) return Result(state.copy(check = check(urgent = true, now, repeated = true)), listOf(AskSafetyCheck(true)))
            val started = startSos(state, input.copy(method = ActivationMethod.SafetyCheckEscalation, userConfirmed = false), now, state.trail)
            return Result(started.state, listOf(ClearSafetyCheck) + started.effects)
        }
        // SOS running but no new GPS fix (indoors, say): still send her last known place every 5 minutes.
        val last = state.lastFix
        if (state.phase == SosActive && state.alertSent && last != null) {
            val decision = UpdateThrottle.decide(state.lastSentFix, state.lastSentAtMillis, last, now, state.canSend, state.pointsHeld)
            if (decision is UpdateThrottle.Decision.Send) return sendUpdate(state, last, decision.pointsHeld, now)
        }
        return Result(state)
    }

    private fun location(state: IncidentState, event: Location, now: Long): Result {
        if (state.phase == Inactive || state.phase == Resolved) return Result(state) // location is only kept during a session
        val next = state.copy(trail = (state.trail + event.fix).takeLast(IncidentState.TRAIL_MAX))
        if (next.phase != SosActive || !next.alertSent) return Result(next)
        return when (val decision = UpdateThrottle.decide(next.lastSentFix, next.lastSentAtMillis, event.fix, now, next.canSend, next.pointsHeld)) {
            is UpdateThrottle.Decision.Send -> sendUpdate(next, event.fix, decision.pointsHeld, now)
            UpdateThrottle.Decision.Hold -> Result(next.copy(pointsHeld = next.pointsHeld + 1))
            UpdateThrottle.Decision.Nothing -> Result(next)
        }
    }

    private fun sendUpdate(state: IncidentState, fix: LocationFix, held: Int, now: Long) =
        Result(state.copy(lastSentFix = fix, lastSentAtMillis = now, pointsHeld = 0), listOf(SendUpdate(fix, held)))
}
