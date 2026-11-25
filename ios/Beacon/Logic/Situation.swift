import Foundation

// The kind of trouble she is in. It picks the checklist she sees; nothing else depends on it.
enum Situation: String, Codable, CaseIterable, Sendable {
    case lost, followed, vehicle, medical, harassment, other

    var key: String { rawValue }

    static func fromKey(_ key: String?) -> Situation? {
        guard let key else { return nil }
        return Situation(rawValue: key.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
    }
}

// PURE LOGIC, no AI: works out the situation from her words by looking for key words.
// Order matters: the more urgent situation wins when two match ("lost and someone is following me").
// Same lists as Android's Situation.kt; tested in SituationTests and shared/test-vectors/situation.json.
enum SituationPicker {
    private static let words: [(Situation, [String])] = [
        (.medical, ["hurt", "bleed", "injur", "sick", "faint", "breath", "ambulance", "hospital", "doctor", "pain", "unconscious", "allerg"]),
        (.vehicle, ["vehicle", "taxi", "uber", "driver", "car ", "in a car", "van ", "bus ", "won't stop", "wont stop", "wrong way", "let me out"]),
        (.followed, ["follow", "stalk", "behind me", "chasing", "watching me"]),
        (.harassment, ["harass", "touch", "grab", "grop", "shout", "threat", "leave me alone", "won't leave", "wont leave", "cornered"]),
        (.lost, ["lost", "don't know where", "dont know where", "can't find", "cant find", "no idea where"]),
    ]

    static func pick(_ description: String) -> Situation {
        let text = " \(description.lowercased()) "
        return words.first { _, keys in keys.contains { text.contains($0) } }?.0 ?? .other
    }
}
