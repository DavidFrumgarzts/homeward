package app.homeward.features.incident

import app.homeward.features.incident.contracts.LocationFix
import app.homeward.features.safetypack.SafetyPack
import app.homeward.features.sos.SosMessageWriter
import app.homeward.features.sos.sending.MessageKind
import app.homeward.profile.UserProfile

// Everything the IncidentEngine needs from the outside world, as one small interface.
// The app gives it AndroidIncidentDeps; tests give it a fake, so the engine runs with no phone.
interface IncidentDeps {
    fun now(): Long
    fun hour(): Int                       // local hour 0-23, for "open now" and risky hours
    fun timeText(millis: Long): String    // "1:56 AM", as written into messages
    fun pack(): SafetyPack
    fun profile(): UserProfile
    fun lastFix(): LocationFix?
    fun online(): Boolean
    fun canSendSms(): Boolean
    fun batteryPercent(): Int
    fun testMode(): Boolean               // debug builds only: no real SMS
    fun familyLink(incidentId: String): String? // the link contacts can follow, once there is one

    suspend fun rewrite(profile: UserProfile, description: String): SosMessageWriter.Sentence
    fun send(incidentId: String, kind: MessageKind, text: String) // to every trusted contact
    fun flushOutbox()
    // Mirror what was just sent to the cloud, for the family view (does nothing if never signed in).
    fun record(kind: MessageKind, state: IncidentState, fix: LocationFix?, pointsHeld: Int)
    fun startSession()                    // keep location (and later the microphone) running
    fun stopSession()
    fun askSafetyCheck(urgent: Boolean)   // show "Are you OK?"
    fun clearSafetyCheck()
    fun dial(number: String)
}
