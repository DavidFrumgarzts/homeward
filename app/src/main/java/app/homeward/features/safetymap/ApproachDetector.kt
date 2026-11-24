package app.homeward.features.safetymap

import app.homeward.device.GeoPoint
import app.homeward.features.safetypack.SafetyZone

// PURE LOGIC: decides WHEN to buzz while you walk.
// Warn when a risky red zone is within range AND you're getting closer to it (not walking away).
// Warns once per zone, then stays quiet for `quietMinutes` so it doesn't nag. Tested in ApproachDetectorTest.
class ApproachDetector(
    private val warnWithinMeters: Double = 250.0,
    private val quietMinutes: Long = 15,
) {
    private var lastPoint: GeoPoint? = null
    private val lastWarnedAt = mutableMapOf<String, Long>()

    // Returns the zone to warn about right now, or null. `nowMillis` is passed in so tests control time.
    fun update(here: GeoPoint, zones: List<SafetyZone>, hour: Int, nowMillis: Long): SafetyZone? {
        val previous = lastPoint
        lastPoint = here
        val zone = ZoneChecker.redZoneAhead(here, zones, hour, warnWithinMeters) ?: return null

        val now = ZoneChecker.distanceToZone(here, zone)
        val before = previous?.let { ZoneChecker.distanceToZone(it, zone) }
        val gettingCloser = before == null || now < before || now == 0.0
        if (!gettingCloser) return null

        val last = lastWarnedAt[zone.name]
        if (last != null && nowMillis - last < quietMinutes * 60_000) return null
        lastWarnedAt[zone.name] = nowMillis
        return zone
    }
}
