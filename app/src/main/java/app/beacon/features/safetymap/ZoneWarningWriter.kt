package app.beacon.features.safetymap

import app.beacon.ai.AiModels
import app.beacon.ai.ask
import app.beacon.features.safetypack.SafetyZone

// ON-DEVICE AI: turns a red zone's saved reasons into one short warning sentence.
// The AI only REPHRASES the saved reasons; it never invents new facts.
// If the AI fails (or isn't on this phone), we fall back to a plain template. Works offline.
object ZoneWarningWriter {
    suspend fun write(zone: SafetyZone): String {
        val fallback = "${zone.name} is usually empty at night. ${zone.reasons.firstOrNull().orEmpty()}".trim()
        val prompt = """
            Write ONE short sentence (max 15 words) warning a walker about this street at night.
            Use only these facts, add nothing: ${zone.name}. ${zone.reasons.joinToString("; ")}.
        """.trimIndent()
        return runCatching { AiModels.hybrid.ask(prompt).text }.getOrNull()?.takeIf { it.isNotBlank() } ?: fallback
    }
}
