package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.ask.AskBeaconRules
import app.homeward.features.safetypack.DemoRioPack
import org.junit.Assert.*
import org.junit.Test

// Checks the no-AI answers: every fact comes from the saved pack, and an unknown question says so.
class AskBeaconRulesTest {
    private val pack = DemoRioPack.pack
    private val bar = GeoPoint(-22.9095, -43.18421) // 75 m from Rua dos Inválidos
    private fun ask(q: String, hour: Int = 1) = AskBeaconRules.answer(q, pack, bar, hour)

    @Test fun numbers() {
        assertEquals("Police: 190. Ambulance: 192.", ask("What's the police number?"))
        assertEquals("U.S. Consulate General Rio de Janeiro: +55 21 3823-2000.", ask("I lost my passport"))
        assertEquals("Ambulance: 192. The nearest hospital saved is Hospital Cruz Vermelha, 387 m away.", ask("I'm hurt"))
    }

    @Test fun nearestOpenPlaceWithItsDistance() = assertEquals("Hospital Cruz Vermelha, 387 m. Open 24h.", ask("Where's a safe place?"))

    @Test fun areaSaysHowFarAndWhetherItIsRiskyNow() {
        assertEquals("Rua dos Inválidos is 74 m from you. Avoid it from 11pm to 5am, which is now. Av. Mem de Sá stays busier.", ask("Is this area OK now?", hour = 1))
        assertTrue(ask("Is this area OK now?", hour = 14).contains("it's fine at this hour"))
        assertTrue(AskBeaconRules.answer("is it risky here", pack, GeoPoint(-22.9098, -43.1825), 1).startsWith("You are in Rua dos Inválidos."))
    }

    @Test fun phrasesAndUnknownQuestions() {
        assertTrue(ask("How do I say help?").contains("Help! = Socorro!"))
        assertEquals("I don't have that saved. Police: 190.", ask("What's the weather?"))
    }

    @Test fun worksWithNoLocation() {
        assertTrue(AskBeaconRules.answer("Where's a safe place?", pack, null, 1).contains("I don't know where you are yet"))
        assertTrue(AskBeaconRules.answer("Is this area OK now?", pack, null, 1).startsWith("Rua dos Inválidos is the nearest risky street saved."))
    }
}
