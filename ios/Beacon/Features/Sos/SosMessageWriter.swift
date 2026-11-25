import Foundation

// PURE LOGIC: the instructions given to the model to turn a panicked note into one clear sentence.
// The model only REWRITES what she said. It is never shown her location, the police number or the
// family link, and never asked to write them: IncidentMessages adds those by code.
// Same wording as Android's SosPrompt.kt.
enum SosPrompt {
    static func build(profile: UserProfile, note: String) -> String {
        let name = profile.displayName
        let refer = switch profile.pronoun {
        case .she: "Use \"she\" and \"her\" after the first mention."
        case .he: "Use \"he\" and \"him\" after the first mention."
        case .they: "Use \"they\" and \"them\" after the first mention."
        case .useName: "Use the name each time; do not use \"he\" or \"she\"."
        }
        return """
        Rewrite this emergency note as one or two clear sentences for the person's family. At most 40 words.
        Write in the third person about \(name). \(refer)
        Keep every fact from the note. Do NOT add facts, places, numbers, advice or greetings.
        Answer with the sentences only.
        Note from \(name): "\(note)"
        """
    }
}

// HYBRID AI (on the iPhone first, cloud as fallback): rewrites what she typed or tapped into one
// clear sentence. Always returns a usable sentence: if the AI fails, is missing, or rambles, the
// plain template is used instead. She always sees and can edit the result before it is sent.
struct SosMessageWriter: Sendable {
    // Swappable for tests: given a prompt, return the model's answer (or throw).
    var ask: @Sendable (String) async throws -> AiAnswer = { try await AiModels.askHybrid($0) }

    // `ranOnDevice` is nil when no AI wrote the text (the plain template).
    struct Sentence: Equatable, Sendable {
        var text: String
        var ranOnDevice: Bool?
    }

    private static let maxCharacters = 400 // far more than 40 words: the model ignored the instructions

    func write(profile: UserProfile, note: String) async -> Sentence {
        let plain = Sentence(text: IncidentMessages.plainSentence(profile: profile, description: note), ranOnDevice: nil)
        if note.isBlank { return plain } // nothing to rewrite, so no AI call
        guard let ai = try? await ask(SosPrompt.build(profile: profile, note: note)) else { return plain }
        let text = ai.text.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "\"")).trimmingCharacters(in: .whitespacesAndNewlines)
        return text.isEmpty || text.count > Self.maxCharacters ? plain : Sentence(text: text, ranOnDevice: ai.ranOnDevice)
    }
}
