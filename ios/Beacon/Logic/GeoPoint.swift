import Foundation

// A latitude/longitude point, plus the one bit of math we need everywhere: distance in metres.
// PURE LOGIC, same as Android's device/GeoPoint.kt. Tested in GeoPointTests and the shared vectors.
struct GeoPoint: Codable, Equatable, Sendable {
    var lat: Double
    var lng: Double

    func meters(to other: GeoPoint) -> Double {
        let r = 6_371_000.0
        let dLat = Self.radians(other.lat - lat)
        let dLng = Self.radians(other.lng - lng)
        let a = sin(dLat / 2) * sin(dLat / 2) +
            cos(Self.radians(lat)) * cos(Self.radians(other.lat)) * sin(dLng / 2) * sin(dLng / 2)
        return r * 2 * atan2(sqrt(a), sqrt(1 - a))
    }

    // Short form used inside SOS messages, e.g. "-22.9133, -43.1801". Always with a dot, whatever
    // the phone's language, so family can paste it into a map.
    func short() -> String { Fixed.format("%.4f, %.4f", lat, lng) }

    // The same constant Java's Math.toRadians uses, so all platforms get the same distances.
    static func radians(_ degrees: Double) -> Double { degrees * 0.017453292519943295 }
}

// Number formatting that never follows the phone's language: a comma instead of a dot would break
// coordinates and map links.
enum Fixed {
    private static let posix = Locale(identifier: "en_US_POSIX")
    static func format(_ format: String, _ args: CVarArg...) -> String { String(format: format, locale: posix, arguments: args) }
}

// A link anyone can tap to see a spot on a map. Added to SOS and "I'm OK" texts.
enum MapsLink {
    static func of(_ p: GeoPoint) -> String { Fixed.format("https://maps.google.com/?q=%.5f,%.5f", p.lat, p.lng) }
}
