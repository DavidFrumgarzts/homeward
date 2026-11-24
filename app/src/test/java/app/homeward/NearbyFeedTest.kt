package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.home.NearbyFeed
import app.homeward.features.safetypack.DemoRioPack
import org.junit.Assert.*
import org.junit.Test

// Checks the Citizen-style Nearby list for the Lapa demo: red zone first, status by hour, safe place last.
class NearbyFeedTest {
    private val nearInvalidos = GeoPoint(-22.9095, -43.1842)

    @Test fun redZoneFirstWithDaytimeStatus() {
        val items = NearbyFeed.build(nearInvalidos, DemoRioPack.pack, hour = 14)
        assertEquals(NearbyFeed.Kind.Avoid, items.first().kind)
        assertEquals("Risky after 11pm", items.first().status)
        assertEquals("Rua dos Inválidos", items.first().detail)
        assertEquals(NearbyFeed.Kind.SafePlace, items.last().kind)
    }

    @Test fun saysAvoidNowAtNight() = assertEquals("Avoid now", NearbyFeed.build(nearInvalidos, DemoRioPack.pack, hour = 1).first().status)

    @Test fun clockAndDistance() {
        assertEquals("11pm", NearbyFeed.clock(23)); assertEquals("midnight", NearbyFeed.clock(0))
        assertEquals("250 m", NearbyFeed.distance(250)); assertEquals("1.2 km", NearbyFeed.distance(1200))
    }
}
