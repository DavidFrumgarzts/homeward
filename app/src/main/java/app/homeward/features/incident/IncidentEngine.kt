package app.homeward.features.incident

import app.homeward.features.incident.contracts.ActivationMethod
import app.homeward.features.incident.contracts.ContactDelivery
import app.homeward.features.incident.contracts.IncidentInput
import app.homeward.features.incident.contracts.IncidentPhase
import app.homeward.features.incident.contracts.IncidentViewState
import app.homeward.features.incident.contracts.LocationFix
import app.homeward.features.sos.sending.MessageKind
import app.homeward.features.sos.sending.SosOutbox
import app.homeward.features.incident.contracts.DeliveryStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.UUID

// PROCESSING: owns the incident. The only writer of IncidentViewState, which the SOS screens draw.
// It lives for the whole app process (created in AppServices, kept alive by SafetySessionService
// while a session runs), so closing the screen does not stop an SOS.
// All decisions are made by IncidentReducer (pure, tested); this class feeds it events and runs the effects.
class IncidentEngine(private val scope: CoroutineScope, private val deps: IncidentDeps) {
    private var state = IncidentState()
    private val _view = MutableStateFlow(IncidentViewState())
    val view: StateFlow<IncidentViewState> = _view
    private val effects = IncidentEffects(deps, scope, { state }, ::dispatch)
    private var ticker: Job? = null

    // ---- Intents: the small set of things screens and triggers may ask for ----
    fun startSos(method: ActivationMethod, description: String = "", reasons: List<String> = emptyList()) {
        val input = IncidentInput(UUID.randomUUID().toString(), method, userConfirmed = true, description.trim(), reasons, deps.lastFix(), deps.online(), deps.now())
        dispatch(IncidentEvent.StartSos(input))
        dispatch(IncidentEvent.Signal(deps.canSendSms()))
        describe(state.description) // sets the plain message at once, and asks the AI if there are words
    }

    fun describe(text: String) =
        dispatch(IncidentEvent.Describe(text, effects.compose(IncidentMessages.plainSentence(deps.profile(), text), state)))

    fun editMessage(text: String) = dispatch(IncidentEvent.EditMessage(text))

    // Sends what she sees. If she didn't edit it by hand, the facts are refreshed with her newest location first.
    fun send() = dispatch(IncidentEvent.Send(if (state.messageEdited) state.message else effects.composeLatest(state)))

    fun imOk() = dispatch(IncidentEvent.ImOk)          // the screen has already asked "are you sure?"
    fun cancel() = dispatch(IncidentEvent.Cancel)      // backed out before sending anything
    fun reset() = dispatch(IncidentEvent.Reset)        // leave the "ended" screen
    fun callEmergency() = deps.dial(_view.value.emergencyNumber)

    // ---- Events from the phone ----
    fun onLocation(fix: LocationFix) {
        dispatch(IncidentEvent.Location(fix))
        // Still writing the message: keep the location in the draft current, unless she edited it herself.
        val s = state
        if (s.phase == IncidentPhase.SosActive && !s.alertSent && !s.messageEdited && !s.writing) {
            dispatch(IncidentEvent.MessageWritten(s.description, effects.composeLatest(s), s.messageRanOnDevice))
        }
    }

    // The outbox reports every status change. Only this incident's messages matter here.
    fun onOutboxChange(entry: SosOutbox.Entry) {
        if (entry.incidentId != state.input?.sessionId) return
        when (entry.kind) {
            MessageKind.Alert -> dispatch(IncidentEvent.Delivery(ContactDelivery(entry.contactName, entry.channel, entry.status, entry.updatedAtMillis)))
            MessageKind.Update -> if (entry.status == DeliveryStatus.Sent || entry.status == DeliveryStatus.Delivered) dispatch(IncidentEvent.UpdateConfirmed(entry.updatedAtMillis))
            else -> Unit
        }
    }

    @Synchronized
    fun dispatch(event: IncidentEvent) {
        val result = IncidentReducer.reduce(state, event, deps.now())
        state = result.state
        publish()
        result.effects.forEach { effects.run(it, result.state) }
        keepTime()
    }

    private fun publish() {
        _view.value = IncidentViewStateMapper.map(state, deps.pack(), deps.hour(), deps.now(), deps.testMode())
    }

    // While something is active, time has to pass: the safety-check countdown every second, and during
    // an SOS a slower beat that re-checks signal and battery and sends the 5-minute update. No AI here.
    private fun keepTime() {
        val active = state.phase == IncidentPhase.SosActive || state.phase == IncidentPhase.SafetyCheckRequested
        if (!active) { ticker?.cancel(); ticker = null; return }
        if (ticker?.isActive == true) return
        ticker = scope.launch {
            while (isActive) {
                delay(if (state.phase == IncidentPhase.SafetyCheckRequested) 1_000L else SOS_BEAT_MILLIS)
                if (state.phase == IncidentPhase.SosActive) {
                    dispatch(IncidentEvent.Signal(deps.canSendSms()))
                    dispatch(IncidentEvent.Battery(deps.batteryPercent()))
                    deps.flushOutbox()
                }
                dispatch(IncidentEvent.Tick)
            }
        }
    }

    companion object {
        const val SOS_BEAT_MILLIS = 15_000L
    }
}
