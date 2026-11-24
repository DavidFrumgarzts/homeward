package app.beacon.features.safeplace

import app.beacon.device.GeoPoint
import app.beacon.features.safetypack.SafePlace

// PURE LOGIC: picks the best place to go right now from the saved pack, and says why.
// "Best" = open now, then closest. A closed police post loses to an open gas station.
object SafePlacePicker {

    data class Pick(val place: SafePlace, val meters: Int, val reason: String)

    fun isOpen(place: SafePlace, hour: Int): Boolean =
        place.open24h || hour in place.opensHour until place.closesHour

    fun pick(here: GeoPoint, places: List<SafePlace>, hour: Int): Pick? {
        val open = places.filter { isOpen(it, hour) }
        val best = open.minByOrNull { here.metersTo(GeoPoint(it.lat, it.lng)) } ?: return null
        val meters = here.metersTo(GeoPoint(best.lat, best.lng)).toInt()
        val closerButClosed = places.firstOrNull {
            !isOpen(it, hour) && here.metersTo(GeoPoint(it.lat, it.lng)) < meters
        }
        val reason = buildString {
            append("${best.name}, $meters m. ")
            append(if (best.open24h) "Open 24h" else "Open now")
            if (best.note.isNotBlank()) append(", ${best.note}")
            append(".")
            if (closerButClosed != null) append(" ${closerButClosed.name} is closer but closed now.")
        }
        return Pick(best, meters, reason)
    }
}
