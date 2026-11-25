import Foundation

// PURE LOGIC: decides WHEN to buzz while you walk.
// Warn when a risky red zone is within range AND you're getting closer to it (not walking away).
// Warns once per zone, then stays quiet for `quietMinutes` so it doesn't nag.
// Same as Android's ApproachDetector.kt; tested in ApproachDetectorTests and shared/test-vectors.
final class ApproachDetector {
    private let warnWithinMeters: Double
    private let quietMinutes: Int64
    private var lastPoint: GeoPoint?
    private var lastWarnedAt: [String: Millis] = [:]

    init(warnWithinMeters: Double = 250, quietMinutes: Int64 = 15) {
        self.warnWithinMeters = warnWithinMeters
        self.quietMinutes = quietMinutes
    }

    // Returns the zone to warn about right now, or nil. `nowMillis` is passed in so tests control time.
    func update(here: GeoPoint, zones: [SafetyZone], hour: Int, nowMillis: Millis) -> SafetyZone? {
        let previous = lastPoint
        lastPoint = here
        guard let zone = ZoneChecker.redZoneAhead(here, zones: zones, hour: hour, withinMeters: warnWithinMeters) else { return nil }

        let now = ZoneChecker.distanceToZone(here, zone)
        let before = previous.map { ZoneChecker.distanceToZone($0, zone) }
        let gettingCloser = before == nil || now < before! || now == 0
        if !gettingCloser { return nil }

        if let last = lastWarnedAt[zone.name], nowMillis - last < quietMinutes * 60_000 { return nil }
        lastWarnedAt[zone.name] = nowMillis
        return zone
    }
}
