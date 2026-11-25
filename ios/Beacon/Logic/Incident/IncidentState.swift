import Foundation

// Everything the engine remembers about the current incident. Only IncidentReducer changes it.
// Same fields as Android's IncidentState.kt.
struct IncidentState: Equatable, Sendable {
    var phase: IncidentPhase = .inactive
    var input: IncidentInput? = nil
    var description: String = ""
    var situation: Situation = .other
    var message: String = ""                    // the draft for contacts
    var messageRanOnDevice: Bool? = nil         // nil = no AI wrote it
    var messageEdited: Bool = false             // she changed the draft by hand: never overwrite it
    var writing: Bool = false
    var alertSent: Bool = false
    var deliveries: [ContactDelivery] = []
    var trail: [LocationFix] = []               // breadcrumbs, newest last, at most trailMax
    var lastSentFix: LocationFix? = nil
    var lastSentAtMillis: Millis = 0
    var lastUpdateConfirmedAtMillis: Millis? = nil
    var pointsHeld: Int = 0                     // points recorded while there was no connection
    var canSend: Bool = true
    var batteryLowSent: Bool = false
    var check: SafetyCheck? = nil
    var endedAtMillis: Millis? = nil

    var lastFix: LocationFix? { trail.last }
    static let trailMax = 200
}

// "Are you OK?" with a deadline. `repeated` = this is the second, urgent ask after a quiet one went unanswered.
struct SafetyCheck: Equatable, Sendable {
    var urgent: Bool
    var deadlineMillis: Millis
    var repeated: Bool = false

    static let quietMillis: Millis = 60_000
    static let urgentMillis: Millis = 30_000
}

// Things that happen. The reducer turns (state, event, time) into a new state and effects.
enum IncidentEvent: Equatable, Sendable {
    case startSos(IncidentInput)                                  // a confirmed trigger
    case raiseSafetyCheck(IncidentInput, urgent: Bool)
    case answerSafetyCheck(ok: Bool)                              // "I'm OK" / "I need help"
    case tick                                                     // time passed
    case describe(text: String, plainMessage: String)             // her words + the no-AI message for them
    case messageWritten(forDescription: String, message: String, ranOnDevice: Bool?)
    case editMessage(String)
    case send(message: String)
    case delivery(ContactDelivery)                                // the alert's status for one contact
    case updateConfirmed(atMillis: Millis)                        // a location update left the phone
    case location(LocationFix)
    case signal(canSend: Bool)
    case battery(percent: Int)
    case imOk                                                     // confirmed: end it
    case cancel                                                   // backed out before anything was sent
    case reset                                                    // leave the "ended" screen
}

// Things the engine must do because of a transition. The reducer only names them; the engine runs them.
enum IncidentEffect: Equatable, Sendable {
    case startSession
    case stopSession
    case writeMessage(description: String)
    case sendAlert(message: String)
    case sendAutoAlert
    case sendUpdate(fix: LocationFix, pointsHeld: Int)
    case sendBatteryLow(fix: LocationFix?)
    case sendEnded
    case flushOutbox
    case askSafetyCheck(urgent: Bool)
    case clearSafetyCheck
}
