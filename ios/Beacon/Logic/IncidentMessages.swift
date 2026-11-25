import Foundation

// PURE LOGIC: every text a trusted contact can receive during an incident, in the order they arrive:
// the alert, location updates, a low-battery note, and the "ended" message.
// Phone numbers, coordinates, links and times are put in HERE, by code. The AI only ever rewrites the
// sentence about what is happening, and never sees or writes these facts.
// Times are passed in as ready-made text ("11:42 PM") so every platform gets identical output.
// Same as Android's IncidentMessages.kt; tested in IncidentMessagesTests and shared/test-vectors/message-templates.json.
enum IncidentMessages {

    // The sentence used when no AI is available, or before it has answered.
    static func plainSentence(profile: UserProfile, description: String) -> String {
        var note = description.trimmingCharacters(in: .whitespacesAndNewlines)
        while let last = note.last, ".!,;".contains(last) { note.removeLast() }
        return note.isEmpty ? "\(profile.displayName) needs help." : "\(profile.displayName) needs help: \(note)."
    }

    // The full alert: what is happening, where and when, the live link (once there is one), what to do.
    static func alert(profile: UserProfile, sentence: String, fix: LocationFix?, fixTime: String?, police: String, familyLink: String? = nil) -> String {
        [
            sentence.trimmingCharacters(in: .whitespacesAndNewlines),
            place(fix, fixTime, label: "Location"),
            familyLink.map { "Follow live: \($0)" },
            callLine(profile, police),
        ].compactMap { $0 }.joined(separator: "\n")
    }

    // Sent only when she did not answer an urgent safety check. Fixed wording, no AI, and it never
    // says a crime is happening: only what Beacon saw.
    static func autoAlert(profile: UserProfile, checkTime: String, fix: LocationFix?, fixTime: String?, reasons: [String], police: String, familyLink: String? = nil) -> String {
        [
            "Beacon safety check: \(profile.displayName) did not respond to a safety check at \(checkTime).",
            place(fix, fixTime, label: "Last location"),
            reasons.isEmpty ? nil : "Why Beacon asked: \(reasons.joined(separator: "; ")).",
            familyLink.map { "Follow live: \($0)" },
            callLine(profile, police),
        ].compactMap { $0 }.joined(separator: "\n")
    }

    static func update(profile: UserProfile, fix: LocationFix, fixTime: String, pointsHeld: Int) -> String {
        let held = pointsHeld > 0 ? "\n\(pointsHeld) location \(pointsHeld == 1 ? "point was" : "points were") recorded while there was no signal." : ""
        return "Beacon update: \(profile.displayName) was here at \(fixTime).\n\(fix.point.short())\n\(MapsLink.of(fix.point))\(held)"
    }

    static func batteryLow(profile: UserProfile, fix: LocationFix?, fixTime: String?) -> String {
        [
            "Beacon: \(profile.displayName)'s phone battery is low. Updates may stop.",
            place(fix, fixTime, label: "Last known location"),
        ].joined(separator: "\n")
    }

    static func ended(profile: UserProfile, time: String) -> String {
        "Beacon: \(profile.displayName) says the SOS is over (\(time)). Beacon has stopped sharing \(profile.possessive) location."
    }

    private static func callLine(_ profile: UserProfile, _ police: String) -> String {
        "Call \(profile.objectForm) now. If there is no answer, call \(police) (police)."
    }

    // "Location: -22.9133, -43.1801 at 11:42 PM" + the map link; says so plainly when there is no fix.
    private static func place(_ fix: LocationFix?, _ fixTime: String?, label: String) -> String {
        guard let fix else { return "\(label): unknown (no GPS fix yet)." }
        return "\(label): \(fix.point.short())\(fixTime.map { " at \($0)" } ?? "")\nMap: \(MapsLink.of(fix.point))"
    }
}
