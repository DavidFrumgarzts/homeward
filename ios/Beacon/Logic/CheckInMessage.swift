import Foundation

// PURE LOGIC: the calm "I'm OK" text for family. Location is included only if she chose that
// in onboarding. Same as Android's CheckInMessage.kt.
enum CheckInMessage {
    static func build(name: String, city: String, time: String, here: GeoPoint?, shareLocation: Bool) -> String {
        let base = "\(name) is OK · \(city) · \(time)"
        if shareLocation, let here { return "\(base)\nWhere: \(MapsLink.of(here))" }
        return base
    }
}
