package app.homeward.features.safetymap

import app.homeward.device.GeoPoint
import app.homeward.features.safetypack.SafetyZone
import app.homeward.features.safetypack.ZoneLevel

// PURE LOGIC (no AI, no Android): is this point inside a zone, and is a red zone close ahead?
// Runs offline on every location update. Tested in ZoneCheckerTest.
object ZoneChecker {

    // Classic ray-casting point-in-polygon test. Polygon points are [lat, lng].
    fun isInside(point: GeoPoint, polygon: List<List<Double>>): Boolean {
        var inside = false
        var j = polygon.lastIndex
        for (i in polygon.indices) {
            val (yi, xi) = polygon[i][0] to polygon[i][1]
            val (yj, xj) = polygon[j][0] to polygon[j][1]
            val crosses = (yi > point.lat) != (yj > point.lat) &&
                point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi
            if (crosses) inside = !inside
            j = i
        }
        return inside
    }

    // Is the zone risky at this hour? Handles overnight ranges like 23 -> 5.
    fun isRiskyAt(zone: SafetyZone, hour: Int): Boolean =
        if (zone.riskyFromHour <= zone.riskyToHour) hour in zone.riskyFromHour until zone.riskyToHour
        else hour >= zone.riskyFromHour || hour < zone.riskyToHour

    // The nearest "Avoid" zone that is risky now and within `withinMeters` of you, or null.
    fun redZoneAhead(here: GeoPoint, zones: List<SafetyZone>, hour: Int, withinMeters: Double = 300.0): SafetyZone? =
        zones.filter { it.level == ZoneLevel.Avoid && isRiskyAt(it, hour) }
            .map { it to distanceToZone(here, it) }
            .filter { it.second <= withinMeters }
            .minByOrNull { it.second }?.first

    // Meters to the zone's nearest EDGE (0 if inside). Edges, not corners: you can be 100 m from
    // the middle of a long street while every corner is 500 m away.
    fun distanceToZone(here: GeoPoint, zone: SafetyZone): Double {
        if (isInside(here, zone.polygon)) return 0.0
        val pts = zone.polygon.map { toMeters(here, it[0], it[1]) } // "here" becomes (0, 0)
        return pts.indices.minOf { i -> distanceToSegment(pts[i], pts[(i + 1) % pts.size]) }
    }

    // Flat x/y meters around "here". Accurate enough at city scale (a few km).
    private fun toMeters(origin: GeoPoint, lat: Double, lng: Double): Pair<Double, Double> {
        val mPerDegLat = 111_320.0
        val mPerDegLng = 111_320.0 * kotlin.math.cos(Math.toRadians(origin.lat))
        return (lng - origin.lng) * mPerDegLng to (lat - origin.lat) * mPerDegLat
    }

    // Distance from (0, 0) to the line segment a-b.
    private fun distanceToSegment(a: Pair<Double, Double>, b: Pair<Double, Double>): Double {
        val (ax, ay) = a; val (bx, by) = b
        val dx = bx - ax; val dy = by - ay
        val lenSq = dx * dx + dy * dy
        val t = if (lenSq == 0.0) 0.0 else ((-ax) * dx + (-ay) * dy) / lenSq
        val k = t.coerceIn(0.0, 1.0)
        return kotlin.math.hypot(ax + k * dx, ay + k * dy)
    }
}
