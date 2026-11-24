package app.homeward

import app.homeward.features.safetyphoto.OutboxSender
import app.homeward.features.safetyphoto.PhotoOutbox
import org.junit.Assert.assertTrue
import org.junit.Test

// Checks the text family receives for a safety photo.
class OutboxSenderTest {
    @Test fun messageHasDescriptionAndLocation() {
        val text = OutboxSender.format(PhotoOutbox.Entry("Taxi, plate DL 1C 4821", -22.9133, -43.1801, 0))
        assertTrue(text.startsWith("Safety photo ("))
        assertTrue(text.contains("Taxi, plate DL 1C 4821"))
        assertTrue(text.contains("-22.9133, -43.1801"))
    }
}
