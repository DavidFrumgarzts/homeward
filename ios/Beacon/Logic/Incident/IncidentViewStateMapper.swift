import Foundation

// PURE LOGIC: turns the engine's state plus the saved pack into what the screens draw (the three cards).
//   For me            -> reviewed checklist for her situation, the pack's number, the nearest open place
//   For my contacts   -> the message draft and where it was written
//   Show someone      -> one reviewed phrase from the pack
// Numbers, places and phrases all come from the pack. Same as Android's IncidentViewStateMapper.kt.
enum IncidentViewStateMapper {
    static func map(_ state: IncidentState, pack: SafetyPack, hour: Int, nowMillis: Millis, testMode: Bool = false) -> IncidentViewState {
        if state.phase == .inactive { return IncidentViewState(emergencyNumber: pack.police, testMode: testMode) }
        let medical = state.situation == .medical
        return IncidentViewState(
            phase: state.phase,
            forMe: ActionChecklist.steps(for: state.situation),
            emergencyNumber: medical ? pack.ambulance : pack.police,
            emergencyLabel: medical ? "ambulance" : "police",
            // No fix, no suggestion: a place picked from a made-up position could send her the wrong way.
            suggestedPlace: state.lastFix.flatMap { SafePlacePicker.pick(here: $0.point, places: pack.safePlaces, hour: hour) },
            contactMessage: state.message,
            contactMessageRanOnDevice: state.messageRanOnDevice,
            showNearby: PhrasePicker.pick(description: state.description, situation: state.situation, phrases: pack.localPhrases),
            deliveries: state.deliveries,
            lastFix: state.lastFix,
            safetyCheckSecondsLeft: state.check.map { max(0, Int(($0.deadlineMillis - nowMillis + 999) / 1000)) },
            description: state.description,
            writingMessage: state.writing,
            alertSent: state.alertSent,
            lastUpdateSentAtMillis: state.lastUpdateConfirmedAtMillis,
            pointsWaiting: state.pointsHeld,
            testMode: testMode
        )
    }
}
