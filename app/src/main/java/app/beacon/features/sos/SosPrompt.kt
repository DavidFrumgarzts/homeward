package app.beacon.features.sos

import app.beacon.device.GeoPoint

// The instructions given to the ON-DEVICE model to turn a panicked note into a clear SOS.
// Rule from past winners: the small model only REWRITES what she said. It must not invent facts.
object SosPrompt {
    fun build(userName: String, note: String, where: String, location: GeoPoint?, policeNumber: String) = """
        Rewrite this emergency note into a clear SOS text message for family. Max 50 words.
        Write in third person about $userName. Keep every fact from the note. Do NOT add any new facts.
        End with: "Call her now. If she doesn't answer, call $policeNumber (police)."
        Note from $userName: "$note"
        Place: $where
        Coordinates: ${location?.short() ?: "unknown"}
    """.trimIndent()
}
