import Foundation

// PURE LOGIC: while an SOS is active, decides when contacts get a location update.
//   - Send when she has moved more than 200 m, or 5 minutes have passed, whichever comes first.
//   - Never more than one update every 2 minutes.
//   - With no connection nothing can go out, so points are only counted. When it is back, ONE
//     update goes out with the latest fix and how many points were recorded, not a flood.
// Same as Android's UpdateThrottle.kt; tested in UpdateThrottleTests and shared/test-vectors/update-throttle.json.
enum UpdateThrottle {
    static let movedMeters = 200.0
    static let everyMillis: Millis = 5 * 60_000
    static let minGapMillis: Millis = 2 * 60_000

    enum Decision: Equatable, Sendable {
        case nothing                 // too soon, or she hasn't moved enough
        case hold                    // no signal: count this point, send later
        case send(pointsHeld: Int)   // send now; pointsHeld > 0 after a gap with no signal
    }

    static func decide(lastSentFix: LocationFix?, lastSentAtMillis: Millis, fix: LocationFix, nowMillis: Millis, canSend: Bool, pointsHeld: Int) -> Decision {
        if !canSend { return .hold }
        let sinceLast = nowMillis - lastSentAtMillis
        if sinceLast < minGapMillis { return .nothing }
        if pointsHeld > 0 { return .send(pointsHeld: pointsHeld) }
        let moved = lastSentFix.map { $0.point.meters(to: fix.point) } ?? .greatestFiniteMagnitude
        return (moved > movedMeters || sinceLast >= everyMillis) ? .send(pointsHeld: 0) : .nothing
    }
}
