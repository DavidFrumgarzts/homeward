package app.homeward.features.home

import app.homeward.device.GeoPoint
import app.homeward.features.safeplace.SafePlacePicker
import app.homeward.features.safetymap.ZoneChecker
import app.homeward.features.safetypack.SafetyPack
import app.homeward.features.safetypack.ZoneLevel

// PURE LOGIC: the "Nearby" list on Home, styled after Citizen's alert cards
// (time/status · plain headline · area). Risky zones first (closest first), then open safe places.
// Describes places and hours only, never people. Tested in NearbyFeedTest.
object NearbyFeed {
    enum class Kind { Avoid, Careful, SafePlace }
    data class Item(val kind: Kind, val status: String, val headline: String, val detail: String, val meters: Int)

    fun build(here: GeoPoint, pack: SafetyPack, hour: Int, withinMeters: Double = 1_500.0, maxZones: Int = 1, maxPlaces: Int = 1): List<Item> {
        val zones = pack.zones
            .filter { it.level != ZoneLevel.Safer }
            .map { it to ZoneChecker.distanceToZone(here, it) }
            .filter { it.second <= withinMeters }
            .sortedBy { it.second }
            .take(maxZones)
            .map { (z, m) ->
                val riskyNow = ZoneChecker.isRiskyAt(z, hour)
                Item(
                    kind = if (z.level == ZoneLevel.Avoid) Kind.Avoid else Kind.Careful,
                    status = if (riskyNow) "Avoid now" else "Risky after ${clock(z.riskyFromHour)}",
                    headline = z.reasons.firstOrNull() ?: z.name,
                    detail = z.name,
                    meters = m.toInt(),
                )
            }
        val place = SafePlacePicker.pick(here, pack.safePlaces, hour)?.let {
            Item(Kind.SafePlace, if (it.place.open24h) "Open 24h" else "Open now", "Safe place: ${it.place.kind}", it.place.name, it.meters)
        }
        return zones + listOfNotNull(place).take(maxPlaces)
    }

    // 23 -> "11pm", 0 -> "midnight", 9 -> "9am"
    fun clock(hour: Int): String = when {
        hour == 0 || hour == 24 -> "midnight"
        hour == 12 -> "noon"
        hour < 12 -> "${hour}am"
        else -> "${hour - 12}pm"
    }

    fun distance(meters: Int): String = if (meters < 1000) "$meters m" else "%.1f km".format(meters / 1000.0)
}
