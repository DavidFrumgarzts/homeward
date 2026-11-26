package app.homeward.features.incident.contracts

import kotlinx.serialization.Serializable

// INPUT -> PROCESSING. Everything the input layer (button, tile, widget, Safe Walk) hands over when a
// safety session starts. The input layer only produces this; it never sends anything itself.
@Serializable
data class IncidentInput(
    val sessionId: String,
    val method: ActivationMethod,
    val userConfirmed: Boolean,           // false when the app raised it without her tapping
    val description: String = "",         // her words or a quick pick, kept as she gave them; may be empty
    val triggerReasons: List<String> = emptyList(), // plain words, e.g. "left planned route", "said 'help'"
    val location: LocationFix? = null,    // null if there is no fix; never invent one
    val online: Boolean = false,
    val startedAtMillis: Long,
)
