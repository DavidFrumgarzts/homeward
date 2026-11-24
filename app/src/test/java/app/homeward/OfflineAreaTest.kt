package app.homeward

import app.homeward.features.offlinemap.OfflineArea
import app.homeward.features.safetypack.DemoRioPack
import org.junit.Assert.assertTrue
import org.junit.Test

// Checks the saved map covers the whole pack but is never huge (tile servers forbid bulk downloads).
class OfflineAreaTest {
    @Test fun coversEveryZoneInTheRioPack() {
        val box = OfflineArea.around(DemoRioPack.pack)!!
        DemoRioPack.pack.zones.flatMap { it.polygon }.forEach { (lat, lng) ->
            assertTrue(lat in box.south..box.north && lng in box.west..box.east)
        }
    }

    @Test fun capsAHugeArea() {
        val capped = OfflineArea.capSize(OfflineArea.Box(north = 10.0, east = 10.0, south = 0.0, west = 0.0))
        assertTrue(capped.north - capped.south <= 0.0601 && capped.east - capped.west <= 0.0601)
    }
}
