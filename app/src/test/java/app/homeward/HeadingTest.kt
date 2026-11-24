package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.lapamap.Heading
import org.junit.Assert.*
import org.junit.Test

// Checks the direction arrow: north is 0, east is 90, and standing still gives no arrow.
class HeadingTest {
    private val start = GeoPoint(-22.9095, -43.1842)

    @Test fun walkingNorthIsZero() = assertEquals(0f, Heading.between(start, GeoPoint(-22.9090, -43.1842))!!, 1f)
    @Test fun walkingEastIsNinety() = assertEquals(90f, Heading.between(start, GeoPoint(-22.9095, -43.1836))!!, 1f)
    @Test fun walkingSouthWestIsBetween180And270() {
        val h = Heading.between(start, GeoPoint(-22.9100, -43.1848))!!
        assertTrue(h > 180f && h < 270f)
    }
    @Test fun standingStillHasNoArrow() = assertNull(Heading.between(start, GeoPoint(-22.90951, -43.18420)))
}
