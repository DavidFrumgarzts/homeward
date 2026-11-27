package app.homeward.features.incident

import app.homeward.features.incident.contracts.IncidentPhase
import app.homeward.features.incident.contracts.IncidentViewState
import app.homeward.features.safeplace.SafePlacePicker
import app.homeward.features.safetypack.SafetyPack

// PURE LOGIC: turns the engine's state plus the saved pack into what the screens draw (the three cards).
//   For me            -> reviewed checklist for her situation, the pack's number, the nearest open place
//   For my contacts   -> the message draft and where it was written
//   Show someone      -> one reviewed phrase from the pack
// Numbers, places and phrases all come from the pack. Tested in IncidentViewStateMapperTest.
object IncidentViewStateMapper {
    fun map(state: IncidentState, pack: SafetyPack, hour: Int, nowMillis: Long, testMode: Boolean = false): IncidentViewState {
        if (state.phase == IncidentPhase.Inactive) return IncidentViewState(emergencyNumber = pack.police, testMode = testMode)
        val medical = state.situation == Situation.Medical
        return IncidentViewState(
            phase = state.phase,
            forMe = ActionChecklist.stepsFor(state.situation),
            emergencyNumber = if (medical) pack.ambulance else pack.police,
            emergencyLabel = if (medical) "ambulance" else "police",
            // No fix, no suggestion: a place picked from a made-up position could send her the wrong way.
            suggestedPlace = state.lastFix?.let { SafePlacePicker.pick(it.point, pack.safePlaces, hour) },
            contactMessage = state.message,
            contactMessageRanOnDevice = state.messageRanOnDevice,
            showNearby = PhrasePicker.pick(state.description, state.situation, pack.localPhrases),
            deliveries = state.deliveries,
            lastFix = state.lastFix,
            safetyCheckSecondsLeft = state.check?.let { ((it.deadlineMillis - nowMillis + 999) / 1000).toInt().coerceAtLeast(0) },
            description = state.description,
            writingMessage = state.writing,
            alertSent = state.alertSent,
            lastUpdateSentAtMillis = state.lastUpdateConfirmedAtMillis,
            pointsWaiting = state.pointsHeld,
            testMode = testMode,
        )
    }
}
