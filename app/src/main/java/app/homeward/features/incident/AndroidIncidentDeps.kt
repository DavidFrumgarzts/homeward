package app.homeward.features.incident

import android.content.Context
import app.homeward.app.AppServices
import app.homeward.features.incident.contracts.LocationFix
import app.homeward.features.policecall.PoliceCaller
import app.homeward.features.session.SafetySessionService
import app.homeward.features.sos.sending.MessageKind
import app.homeward.profile.UserProfile
import app.homeward.testmode.TestMode
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

// The real IncidentDeps: connects the engine to the phone through AppServices.
// One line per need, so "where does the engine get X?" is answered here.
class AndroidIncidentDeps(private val context: Context) : IncidentDeps {
    override fun now() = System.currentTimeMillis()
    override fun hour() = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    override fun timeText(millis: Long): String = SimpleDateFormat("h:mm a", Locale.US).format(Date(millis))
    override fun pack() = AppServices.packStore.load()
    override fun profile() = AppServices.profile.load()
    override fun lastFix(): LocationFix? = AppServices.location.lastFix()
    override fun online() = AppServices.network.hasInternet()
    override fun canSendSms() = AppServices.signal.canSendSms()
    override fun batteryPercent() = AppServices.battery.percent()
    override fun testMode() = TestMode.fakeSms(context)
    override fun familyLink(incidentId: String): String? = null // arrives with the Firestore sync

    override suspend fun rewrite(profile: UserProfile, description: String) = AppServices.sosWriter.write(profile, description)
    override fun send(incidentId: String, kind: MessageKind, text: String) =
        AppServices.sosDispatcher.send(incidentId, kind, AppServices.contacts.all(), text)
    override fun flushOutbox() = AppServices.sosDispatcher.flush()
    override fun startSession() = SafetySessionService.start(context)
    override fun stopSession() = SafetySessionService.stop(context)
    override fun askSafetyCheck(urgent: Boolean) = Unit   // the safety check screen and notification come with Safe Walk
    override fun clearSafetyCheck() = Unit
    override fun dial(number: String) = PoliceCaller.dial(context, number)
}
