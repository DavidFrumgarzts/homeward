package app.homeward.features.ask

import app.homeward.device.GeoPoint
import app.homeward.features.home.NearbyFeed
import app.homeward.features.safeplace.SafePlacePicker
import app.homeward.features.safetymap.ZoneChecker
import app.homeward.features.safetypack.SafetyPack
import app.homeward.features.safetypack.ZoneLevel

// PURE LOGIC: builds the prompt for Ask Beacon. Tested in AskBeaconPromptTest.
// The on-device model is small and can't search, so we hand it every fact it may use:
// the saved numbers, phrases, red zones and the closest open safe places. It only rewrites those into an answer.
object AskBeaconPrompt {
    // `earlier` is the last few question/answer pairs of this chat, oldest first, so a follow-up like
    // "how far is it?" makes sense. The phone's model has no chat memory of its own.
    fun build(question: String, pack: SafetyPack, here: GeoPoint?, hour: Int, earlier: List<Pair<String, String>> = emptyList()): String {
        // Each risky street: how far it is from you, its risky hours, and whether that is right now.
        val zones = pack.zones.filter { it.level != ZoneLevel.Safer }.joinToString("\n") {
            val away = here?.let { h -> "${ZoneChecker.distanceToZone(h, it).toInt()} m from you. " }.orEmpty()
            val now = if (ZoneChecker.isRiskyAt(it, hour)) "risky right now" else "fine at this hour"
            "- ${it.name}: ${away}Avoid from ${NearbyFeed.clock(it.riskyFromHour)} to ${NearbyFeed.clock(it.riskyToHour)} ($now). ${it.reasons.firstOrNull().orEmpty()}"
        }
        val safer = pack.zones.filter { it.level == ZoneLevel.Safer }.joinToString(", ") { it.name }
        val places = pack.safePlaces
            .filter { SafePlacePicker.isOpen(it, hour) }
            .map { it to (here?.metersTo(GeoPoint(it.lat, it.lng))?.toInt()) }
            .sortedBy { it.second ?: Int.MAX_VALUE }
            .take(5)
            .joinToString("\n") { (p, m) -> "- ${p.name} (${p.kind})${m?.let { d -> ", $d m away" }.orEmpty()}, ${if (p.open24h) "open 24h" else "open now"}" }
        val phrases = pack.localPhrases.take(6).joinToString("\n") { "- ${it.english} = ${it.local}" }
        val chat = earlier.takeLast(2).joinToString("\n") { (q, a) -> "Traveler: $q\nBeacon: $a" }.ifBlank { "(nothing yet)" }

        return TEMPLATE
            .replace("{city}", pack.city).replace("{country}", pack.country).replace("{clock}", NearbyFeed.clock(hour))
            .replace("{police}", pack.police).replace("{ambulance}", pack.ambulance)
            .replace("{embassyName}", pack.embassyName).replace("{embassyPhone}", pack.embassyPhone)
            .replace("{zones}", zones).replace("{safer}", safer).replace("{places}", places).replace("{phrases}", phrases)
            .replace("{chat}", chat).replace("{question}", question) // her words go in last, so they can't fill a placeholder
    }

    // The same text as shared/prompts/ask-beacon.txt (SharedPromptsTest fails if they differ).
    val TEMPLATE = """
        You are Beacon, a calm safety helper for a traveler in {city}, {country}. It is {clock}.
        Answer the question using ONLY the facts below. Copy phone numbers and names exactly.
        If asked whether the area is OK, use the distances and hours under "Streets to avoid", and name a safer street or place.
        If the facts don't cover it, say "I don't have that saved. Police: {police}."
        Write at most 3 short steps, plain words, no headings.

        FACTS
        Police: {police}. Ambulance: {ambulance}. Embassy: {embassyName}, {embassyPhone}.
        Streets to avoid:
        {zones}
        Busier, safer streets: {safer}
        Closest open safe places:
        {places}
        Local phrases:
        {phrases}

        EARLIER IN THIS CHAT
        {chat}

        QUESTION: {question}
    """.trimIndent()

    // Used when the AI can't answer at all: the facts that matter most, with no AI involved.
    fun fallback(pack: SafetyPack): String =
        "I couldn't work that out right now. Police: ${pack.police}. Ambulance: ${pack.ambulance}. ${pack.embassyName}: ${pack.embassyPhone}."
}
