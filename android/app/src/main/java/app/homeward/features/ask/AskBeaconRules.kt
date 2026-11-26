package app.homeward.features.ask

import app.homeward.device.GeoPoint
import app.homeward.features.home.NearbyFeed
import app.homeward.features.safeplace.SafePlacePicker
import app.homeward.features.safetymap.ZoneChecker
import app.homeward.features.safetypack.SafetyPack
import app.homeward.features.safetypack.ZoneLevel

// PURE LOGIC, no AI: answers a question from the saved pack with a few key-word rules.
// This is what Ask Beacon says when no model can answer (no Gemini Nano on the phone and no connection).
// Every number, name and distance comes straight from the pack. Same rules as web/js/ask.js.
// Tested in AskBeaconRulesTest.
object AskBeaconRules {
    fun answer(question: String, pack: SafetyPack, here: GeoPoint?, hour: Int): String {
        val q = question.lowercase()
        fun has(vararg words: String) = words.any { q.contains(it) }
        return when {
            has("ambulance", "hospital", "hurt", "doctor") -> {
                val hospital = pack.safePlaces.filter { it.kind == "hospital" }.minByOrNull { p -> here?.metersTo(GeoPoint(p.lat, p.lng)) ?: 0.0 }
                "Ambulance: ${pack.ambulance}." + (hospital?.let { " The nearest hospital saved is ${it.name}${away(here, it.lat, it.lng)}." } ?: "")
            }
            has("embassy", "consulate", "passport") ->
                if (pack.embassyPhone.isBlank()) "I don't have an embassy saved. Police: ${pack.police}." else "${pack.embassyName}: ${pack.embassyPhone}."
            has("police", "number", "emergency") -> "Police: ${pack.police}. Ambulance: ${pack.ambulance}."
            has("safe place", "where", "go ", "open", "far") -> place(pack, here, hour)
            has("ok", "area", "safe", "zone", "danger", "risky") -> area(pack, here, hour)
            has("say", "phrase", "help") -> pack.localPhrases.take(6).joinToString("\n") { "${it.english} = ${it.local}" }.ifBlank { fallback(pack) }
            else -> fallback(pack)
        }
    }

    private fun fallback(pack: SafetyPack) = "I don't have that saved. Police: ${pack.police}."

    private fun away(here: GeoPoint?, lat: Double, lng: Double): String =
        here?.let { ", ${NearbyFeed.distance(it.metersTo(GeoPoint(lat, lng)).toInt())} away" }.orEmpty()

    private fun place(pack: SafetyPack, here: GeoPoint?, hour: Int): String {
        if (here == null) {
            val open = pack.safePlaces.firstOrNull { SafePlacePicker.isOpen(it, hour) } ?: return fallback(pack)
            return "${open.name} is open now. I don't know where you are yet, so I can't say how far it is."
        }
        return SafePlacePicker.pick(here, pack.safePlaces, hour)?.reason ?: "No open place to get help is saved nearby. Police: ${pack.police}."
    }

    // The nearest risky street: how far, its hours, whether that is now, and a busier street to use.
    private fun area(pack: SafetyPack, here: GeoPoint?, hour: Int): String {
        val risky = pack.zones.filter { it.level != ZoneLevel.Safer }
        val zone = (if (here == null) risky.firstOrNull() else risky.minByOrNull { ZoneChecker.distanceToZone(here, it) }) ?: return "No risky streets are saved for ${pack.city}."
        val where = here?.let { h ->
            val meters = ZoneChecker.distanceToZone(h, zone).toInt()
            if (meters == 0) "You are in ${zone.name}." else "${zone.name} is ${NearbyFeed.distance(meters)} from you."
        } ?: "${zone.name} is the nearest risky street saved."
        val now = if (ZoneChecker.isRiskyAt(zone, hour)) ", which is now" else "; it's fine at this hour"
        val safer = pack.zones.firstOrNull { it.level == ZoneLevel.Safer }?.let { " ${it.name} stays busier." }.orEmpty()
        return "$where Avoid it from ${NearbyFeed.clock(zone.riskyFromHour)} to ${NearbyFeed.clock(zone.riskyToHour)}$now.$safer"
    }
}
