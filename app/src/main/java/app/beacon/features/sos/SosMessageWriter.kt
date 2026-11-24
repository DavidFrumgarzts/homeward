package app.beacon.features.sos

import app.beacon.ai.AiModels
import app.beacon.ai.ask
import app.beacon.device.GeoPoint

// ON-DEVICE AI: writes the SOS message from what she typed or tapped.
// Always returns a usable message: if the AI fails, a plain template is used instead.
// She always sees and can edit the result before it is sent.
class SosMessageWriter(
    // Swappable for tests: given a prompt, return text (or throw).
    private val askModel: suspend (String) -> String = { AiModels.hybrid.ask(it).text },
) {
    suspend fun write(userName: String, note: String, where: String, location: GeoPoint?, police: String): String {
        val prompt = SosPrompt.build(userName, note, where, location, police)
        val ai = runCatching { askModel(prompt) }.getOrNull()?.trim()
        return if (ai.isNullOrBlank()) template(userName, note, where, location, police) else ai
    }

    // No-AI fallback. Plain but complete.
    fun template(userName: String, note: String, where: String, location: GeoPoint?, police: String): String =
        "$userName needs help: $note. Last location: $where (${location?.short() ?: "unknown"}). " +
            "Call her now. If she doesn't answer, call $police (police)."
}
