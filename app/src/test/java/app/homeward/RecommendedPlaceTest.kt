package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.ask.AskBeaconPrompt
import app.homeward.features.safeplace.SafePlacePicker
import app.homeward.features.safetypack.DemoRioPack
import app.homeward.features.scancheck.RecommendedPlace
import org.junit.Assert.*
import org.junit.Test

// The place Beacon recommends is picked in code (never read out of the AI's words), then blinks on the map.
class RecommendedPlaceTest {
    private val pack = DemoRioPack.pack
    private val here = GeoPoint(-22.9095, -43.1842)

    @Test fun policeNumberQuestionHasNoPick() = assertNull(RecommendedPlace.pick("What's the police number?", pack, here, 1))

    @Test fun whereCanIGoPicksNearestOpenPlace() =
        assertEquals(SafePlacePicker.pick(here, pack.safePlaces, 1)!!.place, RecommendedPlace.pick("Where can I go?", pack, here, 1))

    @Test fun noLocationPicksFirstOpenPlace() =
        assertEquals(pack.safePlaces.first { SafePlacePicker.isOpen(it, 1) }, RecommendedPlace.pick("Where's a safe place?", pack, null, 1))

    @Test fun byNameIgnoresAccentsAndCase() =
        assertEquals("Hospital Souza Aguiar", RecommendedPlace.byName("hospital souza aguiar", pack)?.name)

    @Test fun byNameUnknownIsNull() = assertNull(RecommendedPlace.byName("Nowhere", pack))

    @Test fun promptTellsModelToRecommendThePickFirst() {
        val pick = RecommendedPlace.pick("Where's a safe place?", pack, here, 1)!!
        assertTrue(AskBeaconPrompt.build("Where's a safe place?", pack, here, 1).contains("Recommend ${pick.name} first."))
    }

    @Test fun promptHasNoRecommendLineForANumberQuestion() =
        assertFalse(AskBeaconPrompt.build("What's the police number?", pack, here, 1).contains("Recommend "))
}
