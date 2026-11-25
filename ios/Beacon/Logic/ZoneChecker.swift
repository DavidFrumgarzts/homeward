import Foundation

// PURE LOGIC (no AI): is this point inside a zone, and is a red zone close ahead?
// Runs offline on every location update. Same as Android's ZoneChecker.kt; tested in ZoneCheckerTests
// and shared/test-vectors.
enum ZoneChecker {

    // Classic ray-casting point-in-polygon test. Polygon points are [lat, lng].
    static func isInside(_ point: GeoPoint, polygon: [[Double]]) -> Bool {
        guard !polygon.isEmpty else { return false }
        var inside = false
        var j = polygon.count - 1
        for i in polygon.indices {
            let yi = polygon[i][0], xi = polygon[i][1]
            let yj = polygon[j][0], xj = polygon[j][1]
            let crosses = (yi > point.lat) != (yj > point.lat) &&
                point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi
            if crosses { inside.toggle() }
            j = i
        }
        return inside
    }

    // Is the zone risky at this hour? Handles overnight ranges like 23 -> 5.
    static func isRisky(_ zone: SafetyZone, hour: Int) -> Bool {
        if zone.riskyFromHour <= zone.riskyToHour { return hour >= zone.riskyFromHour && hour < zone.riskyToHour }
        return hour >= zone.riskyFromHour || hour < zone.riskyToHour
    }

    // The nearest "Avoid" zone that is risky now and within `withinMeters` of you, or nil.
    static func redZoneAhead(_ here: GeoPoint, zones: [SafetyZone], hour: Int, withinMeters: Double = 300) -> SafetyZone? {
        var best: (zone: SafetyZone, meters: Double)?
        for zone in zones where zone.level == .avoid && isRisky(zone, hour: hour) {
            let meters = distanceToZone(here, zone)
            if meters <= withinMeters && (best == nil || meters < best!.meters) { best = (zone, meters) }
        }
        return best?.zone
    }

    // Metres to the zone's nearest EDGE (0 if inside). Edges, not corners: you can be 100 m from
    // the middle of a long street while every corner is 500 m away.
    static func distanceToZone(_ here: GeoPoint, _ zone: SafetyZone) -> Double {
        if isInside(here, polygon: zone.polygon) { return 0 }
        let pts = zone.polygon.map { toMeters(origin: here, lat: $0[0], lng: $0[1]) } // "here" becomes (0, 0)
        guard !pts.isEmpty else { return .greatestFiniteMagnitude }
        return pts.indices.map { distanceToSegment(pts[$0], pts[($0 + 1) % pts.count]) }.min()!
    }

    // Flat x/y metres around "here". Accurate enough at city scale (a few km).
    private static func toMeters(origin: GeoPoint, lat: Double, lng: Double) -> (x: Double, y: Double) {
        let mPerDegLat = 111_320.0
        let mPerDegLng = 111_320.0 * cos(GeoPoint.radians(origin.lat))
        return ((lng - origin.lng) * mPerDegLng, (lat - origin.lat) * mPerDegLat)
    }

    // Distance from (0, 0) to the line segment a-b.
    private static func distanceToSegment(_ a: (x: Double, y: Double), _ b: (x: Double, y: Double)) -> Double {
        let dx = b.x - a.x, dy = b.y - a.y
        let lenSq = dx * dx + dy * dy
        let t = lenSq == 0 ? 0 : ((-a.x) * dx + (-a.y) * dy) / lenSq
        let k = min(max(t, 0), 1)
        return hypot(a.x + k * dx, a.y + k * dy)
    }
}
