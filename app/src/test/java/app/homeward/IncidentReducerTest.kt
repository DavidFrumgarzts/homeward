package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.incident.IncidentEffect
import app.homeward.features.incident.IncidentEvent.*
import app.homeward.features.incident.IncidentReducer
import app.homeward.features.incident.IncidentState
import app.homeward.features.incident.SafetyCheck
import app.homeward.features.incident.Situation
import app.homeward.features.incident.contracts.ActivationMethod
import app.homeward.features.incident.contracts.IncidentInput
import app.homeward.features.incident.contracts.IncidentPhase
import app.homeward.features.incident.contracts.LocationFix
import org.junit.Assert.*
import org.junit.Test

// Checks the edges of the incident state machine. The longer, step-by-step cases shared with iOS are in
// shared/test-vectors/incident-machine.json (IncidentMachineVectorsTest).
class IncidentReducerTest {
    private fun input(confirmed: Boolean = true, description: String = "", fix: LocationFix? = null) =
        IncidentInput("s1", ActivationMethod.SosButton, confirmed, description, listOf("left planned route"), fix, false, 0)
    private fun fix(lat: Double, at: Long) = LocationFix(GeoPoint(lat, -43.18), at, 8f)
    private fun run(vararg steps: Pair<Long, app.homeward.features.incident.IncidentEvent>): Pair<IncidentState, List<IncidentEffect>> {
        var state = IncidentState(); var effects = emptyList<IncidentEffect>()
        steps.forEach { (now, event) -> IncidentReducer.reduce(state, event, now).let { state = it.state; effects = it.effects } }
        return state to effects
    }

    @Test fun confirmedTriggerGoesStraightToSos() {
        val (state, effects) = run(0L to StartSos(input(description = "Being followed")))
        assertEquals(IncidentPhase.SosActive, state.phase); assertEquals(Situation.Followed, state.situation)
        assertFalse(state.alertSent); assertEquals(listOf(IncidentEffect.StartSession), effects)
    }

    @Test fun nothingIsSentUntilSheSends() {
        val (state, effects) = run(0L to StartSos(input()), 1L to Describe("Lost", "Noa needs help: Lost."), 2L to Send("Noa needs help: Lost."))
        assertTrue(state.alertSent); assertEquals(listOf(IncidentEffect.SendAlert("Noa needs help: Lost.")), effects)
    }

    @Test fun unansweredUrgentCheckRaisesTheSosForHer() {
        val (state, effects) = run(0L to RaiseSafetyCheck(input(confirmed = false), urgent = true), SafetyCheck.URGENT_MILLIS to Tick)
        assertEquals(IncidentPhase.SosActive, state.phase); assertTrue(state.alertSent)
        assertEquals(false, state.input?.userConfirmed); assertEquals(ActivationMethod.SafetyCheckEscalation, state.input?.method)
        assertTrue(IncidentEffect.SendAutoAlert in effects)
    }

    @Test fun unansweredQuietCheckIsRepeatedOnceAsUrgent() {
        val (state, effects) = run(0L to RaiseSafetyCheck(input(confirmed = false), urgent = false), SafetyCheck.QUIET_MILLIS to Tick)
        assertEquals(IncidentPhase.SafetyCheckRequested, state.phase)
        assertEquals(SafetyCheck(urgent = true, deadlineMillis = SafetyCheck.QUIET_MILLIS + SafetyCheck.URGENT_MILLIS, repeated = true), state.check)
        assertEquals(listOf(IncidentEffect.AskSafetyCheck(urgent = true)), effects)
    }

    @Test fun imOkClearsASafetyCheckAndNeedHelpStartsSos() {
        assertEquals(IncidentPhase.Inactive, run(0L to RaiseSafetyCheck(input(false), false), 5L to AnswerSafetyCheck(ok = true)).first.phase)
        val (state, _) = run(0L to RaiseSafetyCheck(input(false), false), 5L to AnswerSafetyCheck(ok = false))
        assertEquals(IncidentPhase.SosActive, state.phase); assertEquals(true, state.input?.userConfirmed); assertFalse(state.alertSent)
    }

    @Test fun endingTellsContactsOnlyIfTheyWereAlerted() {
        assertEquals(listOf(IncidentEffect.StopSession), run(0L to StartSos(input()), 1L to ImOk).second)
        assertEquals(listOf(IncidentEffect.SendEnded, IncidentEffect.StopSession), run(0L to StartSos(input()), 1L to Send("x"), 2L to ImOk).second)
    }

    @Test fun trailKeepsTheLast200FixesAndNothingAfterItEnds() {
        var state = IncidentReducer.reduce(IncidentState(), StartSos(input()), 0).state
        repeat(250) { i -> state = IncidentReducer.reduce(state, Location(fix(-22.9 - i * 0.00001, i.toLong())), i.toLong()).state }
        assertEquals(IncidentState.TRAIL_MAX, state.trail.size); assertEquals(249L, state.lastFix?.takenAtMillis)
        val ended = IncidentReducer.reduce(state, ImOk, 300).state
        assertEquals(ended.trail, IncidentReducer.reduce(ended, Location(fix(-22.95, 301)), 301).state.trail)
    }

    @Test fun signalComingBackFlushesTheOutbox() {
        val (_, effects) = run(0L to StartSos(input()), 1L to Signal(false), 2L to Signal(true))
        assertEquals(listOf(IncidentEffect.FlushOutbox), effects)
    }
}
