package app.homeward.features.sos.sending

import app.homeward.contacts.TrustedContact
import java.util.UUID

// Queues one message for every trusted contact and tries to send it straight away.
// Nothing is ever sent without going through the outbox first, so a message written with no signal
// is saved and goes out later. Push is not built (PushSender is a stub), so the channel is always SMS;
// `online` only decides whether we call it "SMS" or "SMS (no data)".
class SosDispatcher(
    private val outbox: SosOutbox,
    private val flusher: OutboxFlusher,
    private val push: PushSender,
    private val hasInternet: () -> Boolean,
    private val now: () -> Long = System::currentTimeMillis,
) {
    fun send(incidentId: String, kind: MessageKind, contacts: List<TrustedContact>, text: String) {
        val online = hasInternet()
        val entries = contacts.map { contact ->
            val chosen = ChannelChooser.choose(online, contactHasApp = false) // TODO: true once contacts have the app
            val channel = if (chosen == SendChannel.Push && !push.send(contact.phone, text)) SendChannel.Sms else chosen
            SosOutbox.Entry(UUID.randomUUID().toString(), incidentId, kind, contact.name, contact.phone, text, channel, now())
        }
        outbox.add(entries)
        entries.forEach { flusher.onChange(it) } // "Saved on your phone", before anything else
        flusher.flush()
    }

    fun flush() = flusher.flush()
}
