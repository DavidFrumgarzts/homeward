package app.homeward.features.sos.sending

import app.homeward.features.incident.contracts.DeliveryStatus

// Sends whatever is still waiting in the SosOutbox, and writes back what the radio says.
// Called when a message is queued, when the connection or signal comes back, and on a timer while
// an SOS is active. With no signal nothing is handed to the radio: entries are marked
// "waiting for signal" and stay in the outbox. No Android here; tested in OutboxFlusherTest.
class OutboxFlusher(
    private val outbox: SosOutbox,
    private val gateway: () -> SmsGateway,
    private val canSend: () -> Boolean,
    private val now: () -> Long = System::currentTimeMillis,
) {
    // Told about every status change (the incident engine listens, to update the screen).
    @Volatile var onChange: (SosOutbox.Entry) -> Unit = {}
    private val inFlight = HashSet<String>() // handed to the radio, no answer yet

    fun flush() {
        val ready = synchronized(inFlight) { outbox.all().filter { it.stillOnPhone && it.id !in inFlight } }
        if (ready.isEmpty()) return
        if (!canSend()) { ready.forEach { mark(it.id, DeliveryStatus.WaitingForSignal) }; return }
        ready.forEach { entry ->
            synchronized(inFlight) { inFlight += entry.id }
            gateway().send(entry.phone, entry.text) { status ->
                // Anything but "sent" ends this attempt ("sent" may still be followed by "delivered").
                if (status != DeliveryStatus.Sent) synchronized(inFlight) { inFlight -= entry.id }
                mark(entry.id, status)
            }
        }
    }

    private fun mark(id: String, status: DeliveryStatus) {
        outbox.setStatus(id, status, now())?.let(onChange)
    }
}
