package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.safetymap.ZoneChecker
import app.homeward.features.safetypack.SafetyZone
import app.homeward.features.safetypack.ZoneLevel
import org.junit.Assert.*
import org.junit.Test

// Checks the offline red-zone logic: inside/outside, night-only risk, and "ahead" distance.
class ZoneCheckerTest {
    private val square = listOf(listOf(0.0, 0.0), listOf(0.0, 0.01), listOf(0.01, 0.01), listOf(0.01, 0.0))
    private val red = SafetyZone("Test street", ZoneLevel.Avoid, square, riskyFromHour = 23, riskyToHour = 5, reasons = listOf("quiet"))

    @Test fun pointInsideIsInside() = assertTrue(ZoneChecker.isInside(GeoPoint(0.005, 0.005), square))
    @Test fun pointOutsideIsOutside() = assertFalse(ZoneChecker.isInside(GeoPoint(0.02, 0.02), square))
    @Test fun overnightRangeIsRiskyAt2am() = assertTrue(ZoneChecker.isRiskyAt(red, 2))
    @Test fun overnightRangeIsSafeAtNoon() = assertFalse(ZoneChecker.isRiskyAt(red, 12))
    @Test fun redZoneFoundWhenCloseAtNight() = assertEquals(red, ZoneChecker.redZoneAhead(GeoPoint(0.011, 0.005), listOf(red), hour = 1))
    @Test fun distanceIsToEdgeNotCorner() = assertTrue(ZoneChecker.distanceToZone(GeoPoint(0.011, 0.005), red) in 100.0..125.0)
    @Test fun noRedZoneInDaytime() = assertNull(ZoneChecker.redZoneAhead(GeoPoint(0.011, 0.005), listOf(red), hour = 14))
}
