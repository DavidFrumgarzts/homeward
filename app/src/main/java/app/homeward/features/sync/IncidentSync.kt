package app.homeward.features.sync

import app.homeward.features.incident.IncidentState
import app.homeward.features.incident.contracts.LocationFix
import app.homeward.features.safetypack.SafetyPack
import app.homeward.features.sos.sending.MessageKind
import app.homeward.profile.UserProfile

// Mirrors an SOS to Firestore so trusted contacts can follow it in the web family view, and gives the
// engine the family link to put in the SMS. SMS stays the path that works with no data: this layer is
// what connects the phone to the web when there IS a connection.
// Nothing is written before she sends the alert. No Firebase in this file (see FirestoreCloud); tested in IncidentSyncTest.
class IncidentSync(
    private val cloud: IncidentCloud,
    private val tripId: () -> String,
    private val shareId: () -> String,
    private val tripCreatedAtMillis: () -> Long,
) {
    val status get() = cloud.status

    fun signIn() = cloud.signIn()

    // The link for the SMS. Null until this phone has signed in once: a link that could never show
    // anything must not be sent.
    fun familyLink(): String? = cloud.uid()?.let { FamilyLink.of(shareId()) }

    // Called for every message that goes to contacts: the alert, each update, low battery, ended.
    fun record(kind: MessageKind, state: IncidentState, fix: LocationFix?, pointsHeld: Int, batteryPercent: Int?, profile: UserProfile, pack: SafetyPack, nowMillis: Long) {
        val uid = cloud.uid() ?: run { cloud.signIn(); return } // never signed in: nothing to attach the data to
        val incidentId = state.input?.sessionId ?: return
        val trip = tripId()
        // Order matters to the security rules: the trip must exist before its share and its incidents.
        cloud.set("trips/$trip", IncidentDocs.trip(uid, profile, pack, tripCreatedAtMillis()))
        cloud.set("shares/${shareId()}", IncidentDocs.share(uid, trip, tripCreatedAtMillis()))
        cloud.set("trips/$trip/incidents/$incidentId", IncidentDocs.incident(uid, trip, state, profile, pack, nowMillis, alertSentAtMillis = nowMillis.takeIf { kind == MessageKind.Alert }))
        cloud.set("trips/$trip/incidents/$incidentId/updates/$nowMillis-${kind.name.lowercase()}", IncidentDocs.update(uid, kind, fix, batteryPercent, pointsHeld, nowMillis))
    }
}
