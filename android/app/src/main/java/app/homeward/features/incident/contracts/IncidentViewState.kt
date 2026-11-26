package app.homeward.features.incident.contracts

import app.homeward.features.safeplace.SafePlacePicker
import app.homeward.features.safetypack.Phrase
import kotlinx.serialization.Serializable

@Serializable
enum class IncidentPhase { Inactive, SafetyCheckRequested, SosActive, Resolved }

// PROCESSING -> DISPLAY. The one thing SOS screens draw. Screens read this and call the engine's
// intents (describe, editMessage, send, imOk, callEmergency); they never work anything out themselves
// and nobody reads AI prose to get these values.
@Serializable
data class IncidentViewState(
    val phase: IncidentPhase = IncidentPhase.Inactive,
    val forMe: List<String> = emptyList(),          // short checklist from the reviewed actions
    val emergencyNumber: String = "",               // from the pack
    val emergencyLabel: String = "police",          // "police" or "ambulance": which number that is
    val suggestedPlace: SafePlacePicker.Pick? = null,
    val contactMessage: String = "",                // editable draft
    val contactMessageRanOnDevice: Boolean? = null, // null = no AI wrote it (plain template or her own edit)
    val showNearby: Phrase? = null,                 // reviewed phrase from the pack
    val deliveries: List<ContactDelivery> = emptyList(),
    val lastFix: LocationFix? = null,               // the UI shows its age
    val safetyCheckSecondsLeft: Int? = null,
    // Beyond the first contract: what the two SOS screens also need to draw.
    val description: String = "",                   // her words so far
    val writingMessage: Boolean = false,            // the AI is rewriting right now
    val alertSent: Boolean = false,                 // she pressed Send, or the automatic alert went out
    val lastUpdateSentAtMillis: Long? = null,       // last location update the radio confirmed
    val pointsWaiting: Int = 0,                     // location points recorded while there was no signal
    val testMode: Boolean = false,                  // debug builds only: no real SMS is sent
)
