import Foundation

// PURE LOGIC: the small text helpers shared by Home, Ask Beacon and the map labels.
// Same wording as Android's NearbyFeed.kt.
enum NearbyFeed {
    // 23 -> "11pm", 0 -> "midnight", 9 -> "9am"
    static func clock(_ hour: Int) -> String {
        if hour == 0 || hour == 24 { return "midnight" }
        if hour == 12 { return "noon" }
        return hour < 12 ? "\(hour)am" : "\(hour - 12)pm"
    }

    // 250 -> "250 m", 1200 -> "1.2 km"
    static func distance(_ meters: Int) -> String {
        meters < 1000 ? "\(meters) m" : Fixed.format("%.1f km", Double(meters) / 1000.0)
    }
}
