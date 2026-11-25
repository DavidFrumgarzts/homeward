import Foundation

// One answer in the chat: the text, and where it was written (nil = no AI, a saved rule answered).
struct BeaconAnswer: Equatable, Sendable {
    var text: String
    var ranOnDevice: Bool?
}

// HYBRID AI: answers a question from the saved safety pack. Runs on the iPhone when Apple's model is
// there (so it works with no signal) and falls back to the cloud. It never fails: when no AI can
// answer, plain rules over the same pack do (AskBeaconRules).
enum AskBeacon {
    static func answer(question: String, earlier: [(q: String, a: String)], pack: SafetyPack, here: GeoPoint?, hour: Int = Clock.hour) async -> BeaconAnswer {
        let prompt = AskBeaconPrompt.build(question: question, pack: pack, here: here, hour: hour, earlier: earlier)
        if let ai = try? await AiModels.askHybrid(prompt), !ai.text.isBlank {
            return BeaconAnswer(text: ai.text, ranOnDevice: ai.ranOnDevice)
        }
        return BeaconAnswer(text: AskBeaconRules.answer(question: question, pack: pack, here: here, hour: hour), ranOnDevice: nil)
    }
}
