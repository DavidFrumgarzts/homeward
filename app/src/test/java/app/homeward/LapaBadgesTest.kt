package app.homeward

import app.homeward.features.lapamap.LapaBadges
import app.homeward.features.lapamap.LapaMapProjection
import app.homeward.features.safetypack.SafePlace
import org.junit.Assert.*
import org.junit.Test

// The drawn Lapa map isn't to scale, so a recommended police station or hospital is ringed on its drawn badge,
// not at its GPS spot (which can land next to you, far from the badge).
class LapaBadgesTest {
    private fun place(kind: String) = SafePlace("x", kind, -22.913, -43.18, open24h = true)

    @Test fun policeRingsThePoliceBadge() = assertEquals(LapaMapProjection.Spot(249f, 298f), LapaBadges.spotFor(place("police")))
    @Test fun hospitalRingsTheHospitalBadge() = assertEquals(LapaMapProjection.Spot(63f, 318f), LapaBadges.spotFor(place("Hospital")))
    @Test fun otherKindsHaveNoBadge() = assertNull(LapaBadges.spotFor(place("gas station")))
}
