package app.homeward.features.incident

import app.homeward.features.incident.IncidentEffect.*
import app.homeward.features.sos.sending.MessageKind
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// Carries out what the reducer asked for: start the session, write the message, send texts.
// The reducer decides WHAT happens; this file only does it. All wording comes from IncidentMessages.
class IncidentEffects(
    private val deps: IncidentDeps,
    private val scope: CoroutineScope,
    private val current: () -> IncidentState,
    private val dispatch: (IncidentEvent) -> Unit,
) {
    // The sentence about what is happening (AI-rewritten or plain). Kept so the facts around it can be
    // refreshed with her newest location at the moment she presses Send.
    private var sentence = ""
    private var writing: Job? = null

    // The whole alert for a sentence: the sentence, then location, link and what to do, added by code.
    fun compose(sentence: String, state: IncidentState): String {
        this.sentence = sentence
        val fix = state.lastFix ?: deps.lastFix()
        return IncidentMessages.alert(deps.profile(), sentence, fix, fix?.let { deps.timeText(it.takenAtMillis) }, deps.pack().police, link(state))
    }

    fun composeLatest(state: IncidentState): String = compose(sentence.ifBlank { IncidentMessages.plainSentence(deps.profile(), state.description) }, state)

    fun run(effect: IncidentEffect, state: IncidentState) {
        when (effect) {
            StartSession -> deps.startSession()
            StopSession -> { writing?.cancel(); deps.stopSession() }
            FlushOutbox -> deps.flushOutbox()
            is AskSafetyCheck -> deps.askSafetyCheck(effect.urgent)
            ClearSafetyCheck -> deps.clearSafetyCheck()
            is WriteMessage -> {
                // Wait for a pause in her typing, then ask the model once (AICore has per-app quotas).
                writing?.cancel()
                writing = scope.launch {
                    delay(WRITE_PAUSE_MILLIS)
                    val written = deps.rewrite(deps.profile(), effect.description)
                    val latest = current()
                    if (latest.description != effect.description) return@launch // she has typed something else since
                    dispatch(IncidentEvent.MessageWritten(effect.description, compose(written.text, latest), written.ranOnDevice))
                }
            }
            else -> send(effect, state)
        }
    }

    // The effects that put a text in the outbox for every trusted contact.
    private fun send(effect: IncidentEffect, state: IncidentState) {
        val input = state.input ?: return
        val profile = deps.profile()
        fun time(fix: app.homeward.features.incident.contracts.LocationFix?) = fix?.let { deps.timeText(it.takenAtMillis) }
        when (effect) {
            is SendAlert -> deps.send(input.sessionId, MessageKind.Alert, effect.message)
            SendAutoAlert -> {
                val text = IncidentMessages.autoAlert(profile, deps.timeText(deps.now()), state.lastFix, time(state.lastFix), input.triggerReasons, deps.pack().police, link(state))
                deps.send(input.sessionId, MessageKind.Alert, text)
                dispatch(IncidentEvent.MessageWritten(state.description, text, null)) // so the screen shows what was sent
            }
            is SendUpdate -> deps.send(input.sessionId, MessageKind.Update, IncidentMessages.update(profile, effect.fix, deps.timeText(effect.fix.takenAtMillis), effect.pointsHeld))
            is SendBatteryLow -> deps.send(input.sessionId, MessageKind.BatteryLow, IncidentMessages.batteryLow(profile, effect.fix, time(effect.fix)))
            SendEnded -> deps.send(input.sessionId, MessageKind.Ended, IncidentMessages.ended(profile, deps.timeText(deps.now())))
            else -> Unit
        }
    }

    private fun link(state: IncidentState): String? = state.input?.sessionId?.let(deps::familyLink)

    companion object {
        const val WRITE_PAUSE_MILLIS = 900L
    }
}
