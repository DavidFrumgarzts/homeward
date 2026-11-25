package app.homeward

import app.homeward.features.incident.contracts.DeliveryStatus
import app.homeward.features.sos.sending.MessageKind
import app.homeward.features.sos.sending.OutboxFlusher
import app.homeward.features.sos.sending.SendChannel
import app.homeward.features.sos.sending.SmsGateway
import app.homeward.features.sos.sending.SosOutbox
import org.junit.Assert.*
import org.junit.Test
import java.io.File

// Checks that an SOS text written with no signal is saved, goes out when signal returns, and that the
// status only ever reports what the (fake) radio said.
class SosOutboxTest {
    private fun outbox() = SosOutbox(File.createTempFile("sos_outbox", ".json").apply { deleteOnExit() })
    private fun entry(id: String) = SosOutbox.Entry(id, "incident", MessageKind.Alert, "Mom", "+972501234567", "help", SendChannel.SmsNoData, createdAtMillis = 0)

    // A radio we control: remembers each text's callback so the test decides what "happens" to it.
    private class FakeRadio : SmsGateway {
        val callbacks = mutableListOf<(DeliveryStatus) -> Unit>()
        override fun send(phone: String, text: String, onStatus: (DeliveryStatus) -> Unit) { callbacks += onStatus }
    }

    @Test fun savedThenWaitingThenSentThenDelivered() {
        val box = outbox(); val radio = FakeRadio(); var signal = false
        val seen = mutableListOf<DeliveryStatus>()
        val flusher = OutboxFlusher(box, { radio }, { signal }, { 1L }).apply { onChange = { seen += it.status } }
        box.add(listOf(entry("a")))
        assertEquals(DeliveryStatus.SavedOnPhone, box.all().single().status)

        flusher.flush() // no signal: nothing is handed to the radio
        assertTrue(radio.callbacks.isEmpty()); assertEquals(DeliveryStatus.WaitingForSignal, box.all().single().status)

        signal = true; flusher.flush()
        assertEquals(1, radio.callbacks.size)
        flusher.flush() // still waiting for the radio's answer: must not send it twice
        assertEquals(1, radio.callbacks.size)

        radio.callbacks[0](DeliveryStatus.Sent); radio.callbacks[0](DeliveryStatus.Delivered)
        assertEquals(listOf(DeliveryStatus.WaitingForSignal, DeliveryStatus.Sent, DeliveryStatus.Delivered), seen)
    }

    @Test fun radioSayingNoServiceKeepsItForTheNextTry() {
        val box = outbox(); val radio = FakeRadio()
        val flusher = OutboxFlusher(box, { radio }, { true }, { 1L })
        box.add(listOf(entry("a"))); flusher.flush()
        radio.callbacks[0](DeliveryStatus.WaitingForSignal)
        assertTrue(box.all().single().stillOnPhone)
        flusher.flush()
        assertEquals("tried again", 2, radio.callbacks.size)
    }

    @Test fun statusNeverMovesBackwardsAndSurvivesAReload() {
        val file = File.createTempFile("sos_outbox", ".json").apply { deleteOnExit() }
        SosOutbox(file).apply { add(listOf(entry("a"))); setStatus("a", DeliveryStatus.Delivered, 5) }
        val reloaded = SosOutbox(file)
        assertNull(reloaded.setStatus("a", DeliveryStatus.Sent, 6))
        assertEquals(DeliveryStatus.Delivered, reloaded.all().single().status)
    }

    @Test fun pruneKeepsUnsentMessagesHoweverOld() {
        val box = outbox()
        box.add(listOf(entry("old-unsent"), entry("old-done")))
        box.setStatus("old-done", DeliveryStatus.Delivered, 1)
        box.prune(nowMillis = 3 * 24 * 60 * 60_000L)
        assertEquals(listOf("old-unsent"), box.all().map { it.id })
    }
}
