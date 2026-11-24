package app.homeward.features.checkin

import app.homeward.app.AppServices
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// "I'm OK": texts every trusted contact a calm update (with location only if she allowed it).
// Peace of mind for family without live tracking. Works by SMS, so no data needed.
object CheckInSender {
    // Returns the names it reached. Blocking (SMS), call off the main thread.
    fun send(): List<String> {
        val pack = AppServices.packStore.load()
        val time = SimpleDateFormat("h:mm a", Locale.US).format(Date())
        val text = CheckInMessage.build(AppServices.USER_NAME, pack.city, time, AppServices.location.lastKnown(), AppServices.locationSharing.onCheckIn)
        return AppServices.contacts.all().filter { AppServices.sms.send(it.phone, text) }.map { it.name }
    }
}
