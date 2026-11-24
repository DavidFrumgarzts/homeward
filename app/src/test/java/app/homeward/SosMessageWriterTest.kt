package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.sos.SosMessageWriter
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

// Checks the SOS always has a usable message, even when the AI fails.
class SosMessageWriterTest {
    @Test fun usesAiTextWhenAvailable() = runBlocking {
        val writer = SosMessageWriter(askModel = { "AI message" })
        assertEquals("AI message", writer.write("Noa", "followed", "Lapa", GeoPoint(1.0, 2.0), "190"))
    }

    @Test fun fallsBackToTemplateWhenAiFails() = runBlocking {
        val writer = SosMessageWriter(askModel = { error("no model") })
        val msg = writer.write("Noa", "being followed", "Lapa", GeoPoint(-22.9133, -43.1801), "190")
        assertTrue(msg.contains("Noa needs help"))
        assertTrue(msg.contains("-22.9133"))
        assertTrue(msg.contains("190"))
    }
}
