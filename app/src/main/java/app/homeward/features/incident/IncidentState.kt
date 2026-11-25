package app.homeward.features.incident

import app.homeward.features.incident.contracts.ContactDelivery
import app.homeward.features.incident.contracts.IncidentInput
import app.homeward.features.incident.contracts.IncidentPhase
import app.homeward.features.incident.contracts.LocationFix

// Everything the engine remembers about the current incident. Only IncidentReducer changes it.
data class IncidentState(
    val phase: IncidentPhase = IncidentPhase.Inactive,
    val input: IncidentInput? = null,
    val description: String = "",
    val situation: Situation = Situation.Other,
    val message: String = "",                  // the draft for contacts
    val messageRanOnDevice: Boolean? = null,   // null = no AI wrote it
    val messageEdited: Boolean = false,        // she changed the draft by hand: never overwrite it
    val writing: Boolean = false,
    val alertSent: Boolean = false,
    val deliveries: List<ContactDelivery> = emptyList(),
    val trail: List<LocationFix> = emptyList(), // breadcrumbs, newest last, at most TRAIL_MAX
    val lastSentFix: LocationFix? = null,
    val lastSentAtMillis: Long = 0,
    val lastUpdateConfirmedAtMillis: Long? = null,
    val pointsHeld: Int = 0,                   // points recorded while there was no signal
    val canSend: Boolean = true,
    val batteryLowSent: Boolean = false,
    val check: SafetyCheck? = null,
    val endedAtMillis: Long? = null,
) {
    val lastFix: LocationFix? get() = trail.lastOrNull()

    companion object {
        const val TRAIL_MAX = 200
    }
}

// "Are you OK?" with a deadline. `repeated` = this is the second, urgent ask after a quiet one went unanswered.
data class SafetyCheck(val urgent: Boolean, val deadlineMillis: Long, val repeated: Boolean = false) {
    companion object {
        const val QUIET_MILLIS = 60_000L
        const val URGENT_MILLIS = 30_000L
    }
}

// Things that happen. The reducer turns (state, event, time) into a new state and effects.
sealed interface IncidentEvent {
    data class StartSos(val input: IncidentInput) : IncidentEvent                     // a confirmed trigger
    data class RaiseSafetyCheck(val input: IncidentInput, val urgent: Boolean) : IncidentEvent
    data class AnswerSafetyCheck(val ok: Boolean) : IncidentEvent                      // "I'm OK" / "I need help"
    data object Tick : IncidentEvent                                                   // time passed
    data class Describe(val text: String, val plainMessage: String) : IncidentEvent    // her words + the no-AI message for them
    data class MessageWritten(val forDescription: String, val message: String, val ranOnDevice: Boolean?) : IncidentEvent
    data class EditMessage(val text: String) : IncidentEvent
    data class Send(val message: String) : IncidentEvent
    data class Delivery(val delivery: ContactDelivery) : IncidentEvent                 // the alert's status for one contact
    data class UpdateConfirmed(val atMillis: Long) : IncidentEvent                     // the radio sent a location update
    data class Location(val fix: LocationFix) : IncidentEvent
    data class Signal(val canSend: Boolean) : IncidentEvent
    data class Battery(val percent: Int) : IncidentEvent
    data object ImOk : IncidentEvent                                                   // confirmed: end it
    data object Cancel : IncidentEvent                                                 // backed out before anything was sent
    data object Reset : IncidentEvent                                                  // leave the "ended" screen
}

// Things the engine must do because of a transition. The reducer only names them; IncidentEffects runs them.
sealed interface IncidentEffect {
    data object StartSession : IncidentEffect
    data object StopSession : IncidentEffect
    data class WriteMessage(val description: String) : IncidentEffect
    data class SendAlert(val message: String) : IncidentEffect
    data object SendAutoAlert : IncidentEffect
    data class SendUpdate(val fix: LocationFix, val pointsHeld: Int) : IncidentEffect
    data class SendBatteryLow(val fix: LocationFix?) : IncidentEffect
    data object SendEnded : IncidentEffect
    data object FlushOutbox : IncidentEffect
    data class AskSafetyCheck(val urgent: Boolean) : IncidentEffect
    data object ClearSafetyCheck : IncidentEffect
}
