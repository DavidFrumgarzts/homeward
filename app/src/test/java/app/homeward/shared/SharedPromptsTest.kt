package app.homeward.shared

import app.homeward.features.ask.AskBeaconPrompt
import app.homeward.features.safetypack.SafetyPackPrompt
import app.homeward.features.sos.SosPrompt
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.File

// shared/prompts/ holds the text of the AI prompts with {placeholders}, so Android, iOS and web ask
// the models the same thing. Each file must be exactly the template the Kotlin code fills in.
// After changing a prompt on purpose, run once with BEACON_WRITE_FIXTURES=1 to write the files again.
class SharedPromptsTest {
    private fun check(fileName: String, template: String) {
        val file = File("../shared/prompts/$fileName")
        if (System.getenv("BEACON_WRITE_FIXTURES") == "1") file.writeText(template + "\n")
        assertEquals("$fileName differs from the Kotlin template", template, file.readText().trimEnd('\n'))
    }

    @Test fun packResearch() = check("pack-research.txt", SafetyPackPrompt.TEMPLATE)
    @Test fun askBeacon() = check("ask-beacon.txt", AskBeaconPrompt.TEMPLATE)
    @Test fun sosSentence() = check("sos-sentence.txt", SosPrompt.TEMPLATE)
}
