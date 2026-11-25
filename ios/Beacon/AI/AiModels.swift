import FirebaseAILogic
import Foundation

// The AI models the whole app uses. Every AI call in Beacon for iOS goes through here.
// (The iOS twin of Android's ai/AiModels.kt.)
//
// 1. hybrid        -> runs ON THE IPHONE (Apple's Foundation Models, with Apple Intelligence) when it
//                     can, and falls back to Gemini in the cloud. Used for everything that should
//                     work with no signal: the SOS message and Ask Beacon. On-device input is text only.
// 2. cloudResearch -> CLOUD ONLY, with Google Search. Builds a city's safety pack while there is wifi.
//
// On-device inference only runs while the app is in the foreground, so nothing here is called from
// the background; background decisions are plain rules.
enum AiModels {
    // Cloud model name. Check the Firebase console's model list if this name is rejected.
    static let cloudModel = "gemini-3.5-flash-lite"
    // What `rawResponse.modelVersion` says when Apple's on-device model answered.
    static let onDeviceModelVersion = "apple-foundation-models-system-language-model"

    // The cloud goes through the Agent Platform (Vertex AI) Gemini API, billed to the Google Cloud
    // account. The Gemini Developer API (googleAI) stopped answering on the Blaze plan (429: it wants
    // prepaid AI Studio credit). "global" is the only location that has this model.
    private static var ai: FirebaseAI { FirebaseAI.firebaseAI(backend: .agentPlatform(location: "global")) }

    // Asks the hybrid model one question. A new session per request: each question is single-turn,
    // and a session would otherwise keep (and resend) the chat history.
    static func askHybrid(_ prompt: String, timeoutSeconds: Double = 20) async throws -> AiAnswer {
        try await withTimeout(seconds: timeoutSeconds) {
            let session = ai.generativeModelSession(model: .hybridModel(primary: .systemModel(), secondary: .geminiModel(name: cloudModel)))
            let response = try await session.respond(to: prompt)
            return AiAnswer(text: response.content.trimmingCharacters(in: .whitespacesAndNewlines),
                            ranOnDevice: response.rawResponse.modelVersion == onDeviceModelVersion)
        }
    }

    // Cloud only, with Google Search, for researching a city (used when a pack is built on the phone).
    static func askCloudResearch(_ prompt: String) async throws -> String {
        let model = ai.generativeModel(modelName: cloudModel, tools: [Tool.googleSearch()])
        return try await model.generateContent(prompt).text ?? ""
    }

    // Is Apple's on-device model ready on this iPhone?
    static var onDevice: OnDeviceStatus {
        #if targetEnvironment(simulator)
        // The simulator says the model is available, but every request to it is refused
        // ("Simulator is not supported"), so the hybrid model always falls back to the cloud here.
        return .simulator
        #else
        switch FirebaseAI.SystemLanguageModel.default.availability {
        case .available: return .ready
        case .unavailable(.appleIntelligenceNotEnabled): return .turnedOff
        case .unavailable(.modelNotReady): return .downloading
        case .unavailable: return .notSupported
        }
        #endif
    }
}

// Why (or why not) answers can be written on this iPhone, in words for the "get ready" step.
enum OnDeviceStatus: Equatable, Sendable {
    case ready, turnedOff, downloading, notSupported, simulator

    var line: String {
        switch self {
        case .ready: "Runs offline on this iPhone, with Apple Intelligence"
        case .turnedOff: "Apple Intelligence is off. Turn it on in Settings for answers with no signal"
        case .downloading: "Apple Intelligence is still downloading. It will be used when it is ready"
        case .notSupported: "This iPhone has no Apple Intelligence. Cloud AI when online, saved answers when not"
        case .simulator: "The simulator can't run Apple's on-device model. Beacon uses cloud AI here"
        }
    }

    var done: Bool { self != .downloading }
}
