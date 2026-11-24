package app.beacon.device

import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

// A latitude/longitude point, plus the one bit of math we need everywhere: distance in meters.
data class GeoPoint(val lat: Double, val lng: Double) {
    fun metersTo(other: GeoPoint): Double {
        val r = 6_371_000.0
        val dLat = Math.toRadians(other.lat - lat)
        val dLng = Math.toRadians(other.lng - lng)
        val a = sin(dLat / 2) * sin(dLat / 2) +
            cos(Math.toRadians(lat)) * cos(Math.toRadians(other.lat)) * sin(dLng / 2) * sin(dLng / 2)
        return r * 2 * atan2(sqrt(a), sqrt(1 - a))
    }

    // Short form used inside SOS messages, e.g. "-22.9133, -43.1801".
    fun short(): String = "%.4f, %.4f".format(lat, lng)
}
