import Foundation
import os

// What Beacon writes to the system log about each Firestore write: whether the server accepted or
// refused it, and which document it was. A tester can then see the live link working without guessing:
//   xcrun simctl spawn booted log stream --predicate 'subsystem == "app.homeward"'
// Ids are shortened and no message text or location is logged.
enum SyncLog {
    private static let log = Logger(subsystem: "app.homeward", category: "sync")

    static func accepted(_ path: String) { log.info("Beacon sync: server accepted \(path, privacy: .public)") }
    static func refused(_ path: String, _ problem: String) { log.error("Beacon sync: server refused \(path, privacy: .public): \(problem, privacy: .public)") }
    static func note(_ text: String) { log.info("Beacon sync: \(text, privacy: .public)") }

    // "4d92aa…": enough to tell documents apart, not enough to open someone's family link.
    static func short(_ id: String) -> String { "\(id.prefix(6))…" }
}
