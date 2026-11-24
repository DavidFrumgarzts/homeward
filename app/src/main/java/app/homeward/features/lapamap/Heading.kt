package app.homeward.features.lapamap

import app.homeward.device.GeoPoint
import kotlin.math.atan2
import kotlin.math.cos

// PURE LOGIC: which way you are walking, worked out from two GPS points in a row.
// Returns degrees clockwise from north (0 = north, 90 = east), or null if you have barely moved,
// because GPS jitter while standing still would make the arrow spin. Tested in HeadingTest.
object Heading {
    const val MIN_METERS = 3.0

    fun between(from: GeoPoint, to: GeoPoint): Float? {
        if (from.metersTo(to) < MIN_METERS) return null
        val east = (to.lng - from.lng) * cos(Math.toRadians(from.lat))
        val north = to.lat - from.lat
        return ((Math.toDegrees(atan2(east, north)) + 360) % 360).toFloat()
    }
}
