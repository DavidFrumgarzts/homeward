package app.homeward.features.safetyphoto

import app.homeward.contacts.TrustedContact
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Sends queued safety photo notes to every trusted contact once the phone is back online.
// An entry leaves the outbox only if it reached everyone; otherwise it waits for the next connection.
class OutboxSender(
    private val outbox: PhotoOutbox,
    private val contacts: () -> List<TrustedContact>,
    private val send: (phone: String, text: String) -> Boolean,
) {
    fun flush() = outbox.flush { entry ->
        val text = format(entry)
        contacts().all { send(it.phone, text) }
    }

    companion object {
        // e.g. "Safety photo (9:14 PM): Taxi, plate DL 1C 4821, white Maruti. Location: -22.9133, -43.1801"
        fun format(e: PhotoOutbox.Entry): String {
            val time = SimpleDateFormat("h:mm a", Locale.US).format(Date(e.timeMillis))
            val where = if (e.lat != null && e.lng != null) " Location: %.4f, %.4f".format(e.lat, e.lng) else ""
            return "Safety photo ($time): ${e.description}.$where"
        }
    }
}
