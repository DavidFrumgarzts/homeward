package app.beacon

import app.beacon.device.GeoPoint
import app.beacon.features.safeplace.SafePlacePicker
import app.beacon.features.safetypack.SafePlace
import org.junit.Assert.*
import org.junit.Test

// Checks that a closed place loses to an open one, and the reason mentions it.
class SafePlacePickerTest {
    private val here = GeoPoint(0.0, 0.0)
    private val closedPolice = SafePlace("Police post", "police", 0.001, 0.0, open24h = false, opensHour = 8, closesHour = 22)
    private val gas = SafePlace("Gas station", "gas station", 0.003, 0.0, open24h = true, note = "well lit")

    @Test fun picksOpenPlaceAtNight() {
        val pick = SafePlacePicker.pick(here, listOf(closedPolice, gas), hour = 1)!!
        assertEquals("Gas station", pick.place.name)
        assertTrue(pick.reason.contains("Police post is closer but closed now"))
    }

    @Test fun picksClosestInDaytime() =
        assertEquals("Police post", SafePlacePicker.pick(here, listOf(closedPolice, gas), hour = 12)!!.place.name)
}
