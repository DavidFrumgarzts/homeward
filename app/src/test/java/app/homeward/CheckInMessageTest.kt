package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.device.MapsLink
import app.homeward.features.checkin.CheckInMessage
import org.junit.Assert.*
import org.junit.Test

// Checks the "I'm OK" text only includes location when she allowed it.
class CheckInMessageTest {
    private val here = GeoPoint(-22.9133, -43.1801)

    @Test fun withoutLocationByDefault() =
        assertEquals("Noa is OK · Rio de Janeiro · 11:45 PM", CheckInMessage.build("Noa", "Rio de Janeiro", "11:45 PM", here, shareLocation = false))

    @Test fun withMapLinkWhenAllowed() {
        val msg = CheckInMessage.build("Noa", "Rio de Janeiro", "11:45 PM", here, shareLocation = true)
        assertTrue(msg.endsWith("Where: https://maps.google.com/?q=-22.91330,-43.18010"))
    }

    @Test fun mapsLinkFormat() = assertEquals("https://maps.google.com/?q=-22.91330,-43.18010", MapsLink.of(here))
}
