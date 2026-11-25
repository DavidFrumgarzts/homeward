import Foundation

// The current time, and the one clock format used in messages ("1:56 AM"), in the phone's time zone.
// Always the same format whatever the phone's language, so messages read the same on every platform.
enum Clock {
    static var nowMillis: Millis { Millis(Date().timeIntervalSince1970 * 1000) }
    static var hour: Int { Calendar.current.component(.hour, from: Date()) }

    private static let formatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "h:mm a"
        return f
    }()

    static func timeText(_ millis: Millis) -> String {
        formatter.string(from: Date(timeIntervalSince1970: Double(millis) / 1000))
    }

    // "just now", "2 min ago", "1 h 5 min ago": how old a GPS fix or an update is.
    static func ageText(_ millis: Millis, now: Millis = nowMillis) -> String {
        let minutes = max(0, (now - millis) / 60_000)
        if minutes < 1 { return "just now" }
        if minutes < 60 { return "\(minutes) min ago" }
        return "\(minutes / 60) h \(minutes % 60) min ago"
    }
}
