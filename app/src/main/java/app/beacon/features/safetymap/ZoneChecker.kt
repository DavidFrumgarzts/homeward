package app.beacon.features.safetymap

import app.beacon.device.GeoPoint
import app.beacon.features.safetypack.SafetyZone
import app.beacon.features.safetypack.ZoneLevel

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

    // Rough distance: 0 if inside, otherwise distance to the closest corner of the zone.
    fun distanceToZone(here: GeoPoint, zone: SafetyZone): Double =
        if (isInside(here, zone.polygon)) 0.0
        else zone.polygon.minOf { here.metersTo(GeoPoint(it[0], it[1])) }
}
