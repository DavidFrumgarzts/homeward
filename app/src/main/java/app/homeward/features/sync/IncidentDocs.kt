package app.homeward.features.sync

import app.homeward.features.incident.IncidentState
import app.homeward.features.incident.contracts.IncidentPhase
import app.homeward.features.incident.contracts.LocationFix
import app.homeward.features.safetypack.SafetyPack
import app.homeward.features.sos.sending.MessageKind
import app.homeward.profile.UserProfile

// PURE LOGIC: the Firestore documents for a trip, its share, an incident and a location update,
// exactly as shared/schema/ describes them (iOS and web write the same shapes).
// The family view reads only incidents and updates, so everything it shows (her name, the city, the
// emergency numbers) is copied into the incident. Tested in IncidentDocsTest against the schemas.
object IncidentDocs {
    const val PLATFORM = "android"

    fun trip(uid: String, profile: UserProfile, pack: SafetyPack, createdAtMillis: Long): Map<String, Any?> = mapOf(
        "ownerUid" to uid, "travelerName" to profile.displayName, "city" to pack.city, "country" to pack.country,
        "packId" to null, "platform" to PLATFORM, "createdAtMillis" to createdAtMillis,
    )

    fun share(uid: String, tripId: String, createdAtMillis: Long): Map<String, Any?> = mapOf(
        "tripId" to tripId, "ownerUid" to uid, "contactLabel" to "Trusted contacts", "createdAtMillis" to createdAtMillis, "revoked" to false,
    )

    // `alertSentAtMillis` is given once, when the alert goes out. Later writes leave it out, and because
    // documents are merged, the first value stays.
    fun incident(uid: String, tripId: String, state: IncidentState, profile: UserProfile, pack: SafetyPack, nowMillis: Long, alertSentAtMillis: Long? = null): Map<String, Any?> {
        val input = requireNotNull(state.input) { "No incident to write" }
        return mapOf<String, Any?>(
            "ownerUid" to uid, "tripId" to tripId,
            "travelerName" to profile.displayName, "city" to pack.city, "country" to pack.country,
            "phase" to state.phase.name, "method" to input.method.name, "userConfirmed" to input.userConfirmed,
            "description" to state.description, "situation" to state.situation.key, "triggerReasons" to input.triggerReasons,
            "message" to if (state.alertSent) state.message else "",
            "emergency" to mapOf("police" to pack.police, "ambulance" to pack.ambulance, "embassyName" to pack.embassyName, "embassyPhone" to pack.embassyPhone),
            "platform" to PLATFORM,
            "startedAtMillis" to input.startedAtMillis,
            "resolvedAtMillis" to state.endedAtMillis.takeIf { state.phase == IncidentPhase.Resolved },
            "updatedAtMillis" to nowMillis,
        ) + (alertSentAtMillis?.let { mapOf("alertSentAtMillis" to it) } ?: emptyMap())
    }

    fun update(uid: String, kind: MessageKind, fix: LocationFix?, batteryPercent: Int?, pointsHeld: Int, nowMillis: Long): Map<String, Any?> = mapOf(
        "ownerUid" to uid,
        "kind" to when (kind) { MessageKind.Alert -> "alert"; MessageKind.Update -> "update"; MessageKind.BatteryLow -> "batteryLow"; MessageKind.Ended -> "ended" },
        "lat" to fix?.point?.lat, "lng" to fix?.point?.lng, "takenAtMillis" to fix?.takenAtMillis, "accuracyMeters" to fix?.accuracyMeters?.toDouble(),
        "batteryPercent" to batteryPercent, "pointsHeld" to pointsHeld, "createdAtMillis" to nowMillis,
    )
}
