package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.lapamap.LapaMapProjection
import org.junit.Assert.*
import org.junit.Test

// Checks that GPS points land in the right place on the illustrated Lapa map.
class LapaMapProjectionTest {
    @Test fun demoSpotLandsNearTheBar() {
        // The emulator's demo position (north-west Lapa) should sit near the bar on the drawing.
        val spot = LapaMapProjection.toSpot(GeoPoint(-22.9095, -43.1842))!!
        assertEquals(78.6f, spot.x, 1f)
        assertEquals(153f, spot.y, 2f)
    }

    @Test fun eastIsRightAndSouthIsDown() {
        val a = LapaMapProjection.toSpot(GeoPoint(-22.9100, -43.1840))!!
        val b = LapaMapProjection.toSpot(GeoPoint(-22.9130, -43.1800))!!
        assertTrue(b.x > a.x)
        assertTrue(b.y > a.y)
    }

    @Test fun outsideLapaIsNotOnTheMap() {
        assertFalse(LapaMapProjection.contains(GeoPoint(41.3083, -72.9279))) // New Haven
        assertNull(LapaMapProjection.toSpot(GeoPoint(-22.9500, -43.1842)))   // Copacabana side
    }
}
