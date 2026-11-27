package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.safetymap.ApproachDetector
import app.homeward.features.safetypack.SafetyZone
import app.homeward.features.safetypack.ZoneLevel
import org.junit.Assert.*
import org.junit.Test

// Checks when the phone buzzes: only while walking TOWARD a risky red zone, once per zone, not again for 15 min.
class ApproachDetectorTest {
    private val square = listOf(listOf(0.0, 0.0), listOf(0.0, 0.01), listOf(0.01, 0.01), listOf(0.01, 0.0))
    private val red = SafetyZone("Test street", ZoneLevel.Avoid, square, riskyFromHour = 23, riskyToHour = 5, reasons = listOf("quiet"))
    private val far = GeoPoint(0.0125, 0.005)   // ~280 m north of the zone
    private val near = GeoPoint(0.0115, 0.005)  // ~170 m
    private val nearer = GeoPoint(0.0105, 0.005) // ~55 m

    @Test fun warnsWhenWalkingTowardAtNight() {
        val d = ApproachDetector()
        assertNull(d.update(far, listOf(red), 1, 0))          // too far yet
        assertEquals(red, d.update(near, listOf(red), 1, 1_000))
    }

    @Test fun silentWhenWalkingAway() {
        val d = ApproachDetector(quietMinutes = 0) // no quiet period, so only direction matters
        assertNotNull(d.update(nearer, listOf(red), 23, 0))
        assertNull(d.update(near, listOf(red), 23, 1_000)) // moved away from the zone
    }

    @Test fun warnsOnlyOncePer15Minutes() {
        val d = ApproachDetector()
        assertNotNull(d.update(near, listOf(red), 1, 0))
        assertNull(d.update(nearer, listOf(red), 1, 5 * 60_000))
        assertNotNull(d.update(GeoPoint(0.0101, 0.005), listOf(red), 1, 16 * 60_000))
    }

    @Test fun silentInDaytime() = assertNull(ApproachDetector().update(near, listOf(red), 14, 0))
}
