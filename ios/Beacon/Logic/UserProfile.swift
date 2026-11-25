import Foundation

// Times are milliseconds since 1970, as on Android and in Firestore.
typealias Millis = Int64

// How messages refer to her after the first mention. UseName is the default: no pronoun is assumed.
enum Pronoun: String, Codable, CaseIterable, Sendable { case useName = "UseName", she = "She", he = "He", they = "They" }

// The little Beacon knows about the traveler: the name family will recognise, how to refer to her,
// and (optional) her nationality, used only to find the right embassy when a pack is built.
// PURE LOGIC, same as Android's profile/UserProfile.kt.
struct UserProfile: Codable, Equatable, Sendable {
    var name: String = ""
    var pronoun: Pronoun = .useName
    var nationality: String = ""

    // Used where a name must appear even if she never typed one.
    var displayName: String {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "Your contact" : trimmed
    }

    // "Call her now" / "Call Noa now"
    var objectForm: String {
        switch pronoun { case .she: "her"; case .he: "him"; case .they: "them"; case .useName: displayName }
    }

    // "sharing her location" / "sharing Noa's location"
    var possessive: String {
        switch pronoun { case .she: "her"; case .he: "his"; case .they: "their"; case .useName: "\(displayName)'s" }
    }
}
