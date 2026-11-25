import Foundation

// PURE LOGIC: places a GPS point on the drawn Lapa map, and tells which way you are walking.
// The drawing uses its own grid, 393 wide and 520 tall (the same numbers as the Figma frame, the
// Android app and web/js/map.js). The map is stylized, so this is a simple straight-line fit.
enum LapaMapProjection {
    static let width = 393.0
    static let height = 520.0

    // The real-world box the drawing covers (about 920 m wide, 1.2 km tall).
    private static let west = -43.1860, east = -43.1770, north = -22.90628, south = -22.91722

    struct Spot: Equatable, Sendable { var x: Double; var y: Double }

    static func contains(_ p: GeoPoint) -> Bool { p.lng >= west && p.lng <= east && p.lat >= south && p.lat <= north }

    // Nil when the point is outside the drawing.
    static func toSpot(_ p: GeoPoint) -> Spot? {
        guard contains(p) else { return nil }
        return Spot(x: (p.lng - west) / (east - west) * width, y: (north - p.lat) / (north - south) * height)
    }

    // The other way round: a spot on the drawing as a GPS point (used for the story and previews).
    static func toGeo(_ s: Spot) -> GeoPoint {
        GeoPoint(lat: north - s.y / height * (north - south), lng: west + s.x / width * (east - west))
    }
}

// Which way you are walking, from two GPS points in a row: degrees clockwise from north, or nil
// if you have barely moved (GPS jitter while standing still would make the arrow spin).
enum Heading {
    static let minMeters = 3.0

    static func between(_ from: GeoPoint, _ to: GeoPoint) -> Double? {
        if from.meters(to: to) < minMeters { return nil }
        let east = (to.lng - from.lng) * cos(GeoPoint.radians(from.lat))
        let north = to.lat - from.lat
        return (atan2(east, north) * 180 / .pi + 360).truncatingRemainder(dividingBy: 360)
    }
}
