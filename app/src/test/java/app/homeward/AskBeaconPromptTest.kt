package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.ask.AskBeaconPrompt
import app.homeward.features.safetypack.DemoRioPack
import org.junit.Assert.*
import org.junit.Test

// Checks that Ask Beacon hands the AI the saved facts, so it never has to invent a number.
class AskBeaconPromptTest {
    private val pack = DemoRioPack.pack
    private val here = GeoPoint(-22.9095, -43.1842)

    @Test fun promptCarriesTheSavedNumbersAndTheQuestion() {
        val prompt = AskBeaconPrompt.build("What's the police number?", pack, here, hour = 1)
        assertTrue(prompt.contains("Police: ${pack.police}"))
        assertTrue(prompt.contains(pack.embassyPhone))
        assertTrue(prompt.contains("QUESTION: What's the police number?"))
    }

    @Test fun promptListsStreetsToAvoidButNotSaferOnes() {
        val prompt = AskBeaconPrompt.build("Is this area OK?", pack, here, hour = 1)
        assertTrue(prompt.contains("Rua dos Inválidos"))
        assertTrue(prompt.contains("risky right now")) // 1am is inside its risky hours
        assertTrue(prompt.contains("m from you"))
        assertFalse(prompt.contains("- Av. Mem de Sá: avoid"))
    }

    @Test fun followUpsCarryTheLastTwoExchanges() {
        val earlier = listOf("one" to "first", "Where's a safe place?" to "5º DP, 59 m.", "Is it open?" to "Yes, open now.")
        val prompt = AskBeaconPrompt.build("How do I get there?", pack, here, hour = 1, earlier = earlier)
        assertTrue(prompt.contains("Traveler: Where's a safe place?"))
        assertTrue(prompt.contains("Beacon: Yes, open now."))
        assertFalse(prompt.contains("Traveler: one")) // only the last two are kept, to stay short
    }

    @Test fun fallbackStillGivesTheNumbers() {
        val text = AskBeaconPrompt.fallback(pack)
        assertTrue(text.contains(pack.police))
        assertTrue(text.contains(pack.ambulance))
    }
}
