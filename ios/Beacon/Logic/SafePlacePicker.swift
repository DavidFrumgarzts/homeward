import Foundation

// PURE LOGIC: picks the best place to go right now from the saved pack, and says why.
// "Best" = open now, then closest. A closed police post loses to an open petrol station.
// Same as Android's SafePlacePicker.kt; tested in SafePlacePickerTests and shared/test-vectors.
enum SafePlacePicker {
    struct Pick: Codable, Equatable, Sendable {
        var place: SafePlace
        var meters: Int
        var reason: String
    }

    static func isOpen(_ place: SafePlace, hour: Int) -> Bool {
        place.open24h || (hour >= place.opensHour && hour < place.closesHour)
    }

    static func pick(here: GeoPoint, places: [SafePlace], hour: Int) -> Pick? {
        var best: SafePlace?
        var bestMeters = Double.greatestFiniteMagnitude
        for place in places where isOpen(place, hour: hour) {
            let d = here.meters(to: place.point)
            if d < bestMeters { best = place; bestMeters = d }
        }
        guard let best else { return nil }
        let meters = Int(bestMeters)
        let closerButClosed = places.first { !isOpen($0, hour: hour) && here.meters(to: $0.point) < Double(meters) }
        var reason = "\(best.name), \(meters) m. "
        reason += best.open24h ? "Open 24h" : "Open now"
        if !best.note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { reason += ", \(best.note)" }
        reason += "."
        if let closerButClosed { reason += " \(closerButClosed.name) is closer but closed now." }
        return Pick(place: best, meters: meters, reason: reason)
    }
}
