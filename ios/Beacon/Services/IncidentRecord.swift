import Foundation

// PURE: one incident as it is saved in Firestore (trips/{tripId}/incidents/{incidentId}), built from
// the engine's state, the profile and the pack. Field names are the ones in
// shared/schema/incident.schema.json; change them there first. Tested in IncidentRecordTests.
struct IncidentRecord: Equatable, Sendable {
    var id: String
    var travelerName: String
    var city: String
    var country: String
    var phase: IncidentPhase
    var method: ActivationMethod
    var userConfirmed: Bool
    var description: String
    var situation: Situation
    var triggerReasons: [String]
    var message: String
    var police: String
    var ambulance: String
    var embassyName: String
    var embassyPhone: String
    var startedAtMillis: Millis
    var alertSentAtMillis: Millis?
    var resolvedAtMillis: Millis?
    var updatedAtMillis: Millis

    init?(state: IncidentState, profile: UserProfile, pack: SafetyPack, now: Millis) {
        guard let input = state.input, state.phase != .inactive else { return nil }
        id = input.sessionId
        travelerName = profile.displayName
        city = pack.city; country = pack.country
        phase = state.phase; method = input.method; userConfirmed = input.userConfirmed
        description = state.description; situation = state.situation; triggerReasons = input.triggerReasons
        message = state.alertSent ? state.message : ""
        police = pack.police; ambulance = pack.ambulance; embassyName = pack.embassyName; embassyPhone = pack.embassyPhone
        startedAtMillis = input.startedAtMillis
        alertSentAtMillis = state.alertSent ? state.lastSentAtMillis : nil
        resolvedAtMillis = state.endedAtMillis
        updatedAtMillis = now
    }

    // trips/{tripId}: only the owner reads this.
    var tripFields: [String: Any] {
        ["travelerName": travelerName, "city": city, "country": country, "packId": NSNull(), "platform": "ios", "createdAtMillis": startedAtMillis]
    }

    // The incident document. `ownerUid` is added by IncidentSync once the phone has signed in.
    func fields(tripId: String) -> [String: Any] {
        [
            "tripId": tripId, "travelerName": travelerName, "city": city, "country": country,
            "phase": phase.rawValue, "method": method.rawValue, "userConfirmed": userConfirmed,
            "description": description, "situation": situation.key, "triggerReasons": triggerReasons, "message": message,
            "emergency": ["police": police, "ambulance": ambulance, "embassyName": embassyName, "embassyPhone": embassyPhone],
            "platform": "ios", "startedAtMillis": startedAtMillis,
            "alertSentAtMillis": alertSentAtMillis.map { $0 as Any } ?? NSNull(),
            "resolvedAtMillis": resolvedAtMillis.map { $0 as Any } ?? NSNull(),
            "updatedAtMillis": updatedAtMillis,
        ]
    }
}
