import Foundation

// The shared contracts between the three layers, same names and fields as Android's
// features/incident/contracts/. Input produces IncidentInput; screens only draw IncidentViewState.

// How a safety session was started. Saved with every incident, so family and tests can see what raised it.
enum ActivationMethod: String, Codable, Sendable {
    case sosButton = "SosButton", widget = "Widget", talkTile = "TalkTile", askBeacon = "AskBeacon"
    case voiceShortcut = "VoiceShortcut", safePhrase = "SafePhrase"
    case safetyCheckEscalation = "SafetyCheckEscalation", safeWalkMissedArrival = "SafeWalkMissedArrival"
}

// One GPS reading: where, when it was taken, and how exact. The time matters as much as the place:
// the UI and every message say how old a fix is, and a missing fix stays missing (never invented).
struct LocationFix: Codable, Equatable, Sendable {
    var point: GeoPoint
    var takenAtMillis: Millis
    var accuracyMeters: Double? = nil
}

// INPUT -> PROCESSING. Everything the input layer hands over when a safety session starts.
struct IncidentInput: Codable, Equatable, Sendable {
    var sessionId: String
    var method: ActivationMethod
    var userConfirmed: Bool                 // false when the app raised it without her tapping
    var description: String = ""            // her words or a quick pick, kept as she gave them; may be empty
    var triggerReasons: [String] = []       // plain words, e.g. "left planned route"
    var location: LocationFix? = nil        // nil if there is no fix; never invent one
    var online: Bool = false
    var startedAtMillis: Millis
}

// What really happened to a message for one contact.
enum DeliveryStatus: String, Codable, Sendable {
    case savedOnPhone = "SavedOnPhone", waitingForSignal = "WaitingForSignal", sent = "Sent", delivered = "Delivered", failed = "Failed"
}

// How a message travels to one contact.
enum SendChannel: String, Codable, Sendable {
    case push = "Push", sms = "Sms", smsNoData = "SmsNoData"
}

struct ContactDelivery: Codable, Equatable, Sendable {
    var contactName: String
    var channel: SendChannel
    var status: DeliveryStatus
    var updatedAtMillis: Millis
}

enum IncidentPhase: String, Codable, Sendable {
    case inactive = "Inactive", safetyCheckRequested = "SafetyCheckRequested", sosActive = "SosActive", resolved = "Resolved"
}

// PROCESSING -> DISPLAY. The one thing SOS screens draw. Screens read this and call the engine's
// intents (describe, editMessage, send, imOk, callEmergency); they never work anything out themselves.
struct IncidentViewState: Equatable, Sendable {
    var phase: IncidentPhase = .inactive
    var forMe: [String] = []                    // short checklist from the reviewed actions
    var emergencyNumber: String = ""            // from the pack
    var emergencyLabel: String = "police"       // "police" or "ambulance": which number that is
    var suggestedPlace: SafePlacePicker.Pick? = nil
    var contactMessage: String = ""             // editable draft
    var contactMessageRanOnDevice: Bool? = nil  // nil = no AI wrote it (plain template or her own edit)
    var showNearby: Phrase? = nil               // reviewed phrase from the pack
    var deliveries: [ContactDelivery] = []
    var lastFix: LocationFix? = nil             // the UI shows its age
    var safetyCheckSecondsLeft: Int? = nil
    var description: String = ""                // her words so far
    var writingMessage: Bool = false            // the AI is rewriting right now
    var alertSent: Bool = false                 // she pressed Send, or the automatic alert went out
    var lastUpdateSentAtMillis: Millis? = nil   // last location update that left the phone
    var pointsWaiting: Int = 0                  // location points recorded while there was no connection
    var testMode: Bool = false                  // debug builds on the simulator: Messages cannot open
}

// Decoding by hand so a missing optional field takes its default instead of failing.
extension LocationFix {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        point = try c.decode(GeoPoint.self, forKey: .point)
        takenAtMillis = try c.decode(Millis.self, forKey: .takenAtMillis)
        accuracyMeters = try c.decodeIfPresent(Double.self, forKey: .accuracyMeters)
    }
}

extension IncidentInput {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        sessionId = try c.decode(String.self, forKey: .sessionId)
        method = try c.decode(ActivationMethod.self, forKey: .method)
        userConfirmed = try c.decode(Bool.self, forKey: .userConfirmed)
        description = try c.decodeIfPresent(String.self, forKey: .description) ?? ""
        triggerReasons = try c.decodeIfPresent([String].self, forKey: .triggerReasons) ?? []
        location = try c.decodeIfPresent(LocationFix.self, forKey: .location)
        online = try c.decodeIfPresent(Bool.self, forKey: .online) ?? false
        startedAtMillis = try c.decode(Millis.self, forKey: .startedAtMillis)
    }
}
