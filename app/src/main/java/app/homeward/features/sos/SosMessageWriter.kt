package app.homeward.features.sos

import app.homeward.ai.AiAnswer
import app.homeward.ai.AiModels
import app.homeward.ai.ask
import app.homeward.features.incident.IncidentMessages
import app.homeward.profile.UserProfile

// HYBRID AI (PREFER_ON_DEVICE): rewrites what she typed or tapped into one clear sentence.
// Always returns a usable sentence: if the AI fails, is missing, or rambles, the plain template is
// used instead. The facts around the sentence (location, time, numbers, link) are added by
// IncidentMessages, never by the model. She always sees and can edit the result before it is sent.
class SosMessageWriter(
    // Swappable for tests: given a prompt, return the model's answer (or throw).
    private val askModel: suspend (String) -> AiAnswer = { AiModels.hybrid.ask(it) },
) {
    // `ranOnDevice` is null when no AI wrote the text (the plain template).
    data class Sentence(val text: String, val ranOnDevice: Boolean?)

    suspend fun write(profile: UserProfile, note: String): Sentence {
        val plain = Sentence(IncidentMessages.plainSentence(profile, note), null)
        if (note.isBlank()) return plain // nothing to rewrite, so no AI call
        val ai = runCatching { askModel(SosPrompt.build(profile, note)) }.getOrNull() ?: return plain
        val text = ai.text.trim().trim('"').trim()
        return if (text.isBlank() || text.length > MAX_CHARS) plain else Sentence(text, ai.ranOnDevice)
    }

    private companion object {
        const val MAX_CHARS = 400 // far more than 40 words: the model ignored the instructions
    }
}
