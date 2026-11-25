import Foundation

// PURE LOGIC: picks which reviewed phrase from the pack to show a stranger ("Show someone nearby").
// It only ever returns a phrase that is already in the pack; nothing is translated here.
// The phrase whose English shares the most words with her description wins, then the one that fits
// her situation; with no match it is the first phrase in the pack (packs start with "Help!").
// Same as Android's PhrasePicker.kt; tested in PhrasePickerTests and shared/test-vectors/phrase-picker.json.
enum PhrasePicker {
    // Words that point to a phrase even when she didn't type them.
    private static let hints: [Situation: Set<String>] = [
        .followed: ["followed", "following"],
        .medical: ["hospital", "doctor", "ambulance"],
        .vehicle: ["stop", "police"],
        .harassment: ["alone", "police"],
        .lost: ["lost", "where"],
        .other: ["help"],
    ]

    static func pick(description: String, situation: Situation, phrases: [Phrase]) -> Phrase? {
        guard let first = phrases.first else { return nil }
        let said = Set(words(description).filter { $0.count > 3 })
        let hinted = hints[situation] ?? []
        // Her own words count double: what she typed is a stronger signal than the situation's hint.
        func score(_ phrase: Phrase) -> Int {
            words(phrase.english).reduce(0) { $0 + (said.contains($1) ? 2 : hinted.contains($1) ? 1 : 0) }
        }
        var best = first
        var bestScore = score(first)
        for phrase in phrases.dropFirst() where score(phrase) > bestScore { // the first of the best: pack order breaks ties
            best = phrase
            bestScore = score(phrase)
        }
        return bestScore == 0 ? first : best
    }

    // Lowercase runs of a-z and apostrophes, like the Android version's split on [^a-z']+.
    private static func words(_ text: String) -> [String] {
        text.lowercased().split { ch in
            guard let a = ch.asciiValue else { return true }
            return !((97...122).contains(a) || a == 39)
        }.map(String.init)
    }
}
