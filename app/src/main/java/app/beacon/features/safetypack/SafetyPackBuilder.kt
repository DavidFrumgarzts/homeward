package app.beacon.features.safetypack

import app.beacon.ai.AiModels
import app.beacon.ai.ask
import kotlinx.serialization.json.Json

// CLOUD-ONLY feature: researches a city with Gemini + Google Search and turns it into a SafetyPack.
// Runs once when you land (on airport or hotel wifi). After that the pack is used offline.
class SafetyPackBuilder(private val store: SafetyPackStore) {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    suspend fun build(city: String, country: String, nationality: String): SafetyPack {
        val answer = AiModels.cloudResearch.ask(SafetyPackPrompt.forCity(city, country, nationality))
        val pack = json.decodeFromString<SafetyPack>(extractJson(answer.text))
            .copy(builtAtMillis = System.currentTimeMillis())
        store.save(pack) // saved to the phone so everything after this works offline
        return pack
    }

    // The model sometimes wraps JSON in ```json fences or adds a sentence. Keep only the {...} part.
    internal fun extractJson(text: String): String {
        val start = text.indexOf('{')
        val end = text.lastIndexOf('}')
        require(start >= 0 && end > start) { "No JSON in model answer" }
        return text.substring(start, end + 1)
    }
}
