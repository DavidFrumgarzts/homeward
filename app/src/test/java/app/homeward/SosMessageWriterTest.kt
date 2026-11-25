package app.homeward

import app.homeward.ai.AiAnswer
import app.homeward.features.sos.SosMessageWriter
import app.homeward.features.sos.SosPrompt
import app.homeward.profile.Pronoun
import app.homeward.profile.UserProfile
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

// Checks the SOS always has a usable sentence, even when the AI fails, and that the model is never
// handed (or asked for) a location or a phone number.
class SosMessageWriterTest {
    private val noa = UserProfile("Noa")

    @Test fun usesAiTextAndSaysWhereItRan() = runBlocking {
        val written = SosMessageWriter(askModel = { AiAnswer("\"Noa is being followed.\"", ranOnDevice = true) }).write(noa, "followed")
        assertEquals("Noa is being followed.", written.text)
        assertEquals(true, written.ranOnDevice)
    }

    @Test fun fallsBackToTemplateWhenAiFails() = runBlocking {
        val written = SosMessageWriter(askModel = { error("no model") }).write(noa, "being followed")
        assertEquals("Noa needs help: being followed.", written.text)
        assertNull(written.ranOnDevice) // no AI wrote it
    }

    @Test fun fallsBackWhenAiRambles() = runBlocking {
        val written = SosMessageWriter(askModel = { AiAnswer("x".repeat(500), ranOnDevice = false) }).write(noa, "lost")
        assertEquals("Noa needs help: lost.", written.text)
    }

    @Test fun noWordsMeansNoAiCall() = runBlocking {
        var asked = false
        val written = SosMessageWriter(askModel = { asked = true; AiAnswer("x", true) }).write(noa, "  ")
        assertEquals("Noa needs help.", written.text); assertFalse(asked)
    }

    @Test fun promptHasHerWordsButNoFacts() {
        val prompt = SosPrompt.build(UserProfile("Noa", Pronoun.She), "guy following me")
        assertTrue(prompt.contains("guy following me")); assertTrue(prompt.contains("\"she\""))
        assertFalse(prompt.contains("190")); assertFalse(prompt.contains("maps.google"))
        assertTrue(SosPrompt.build(noa, "x").contains("do not use \"he\" or \"she\""))
    }
}
