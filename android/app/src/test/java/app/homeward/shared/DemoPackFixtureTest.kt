package app.homeward.shared

import app.homeward.features.safetypack.DemoRioPack
import app.homeward.features.safetypack.SafetyPack
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.File

// shared/fixtures/rio-lapa-pack.json is the demo pack iOS and web load. It must be exactly DemoRioPack.
// After changing DemoRioPack, run the tests once with BEACON_WRITE_FIXTURES=1 to write the file again.
class DemoPackFixtureTest {
    private val file = File("../../shared/fixtures/rio-lapa-pack.json")

    @Test fun fixtureIsTheDemoPack() {
        if (System.getenv("BEACON_WRITE_FIXTURES") == "1") file.writeText(SharedVectors.json.encodeToString(DemoRioPack.pack) + "\n")
        assertEquals(DemoRioPack.pack, SharedVectors.json.decodeFromString<SafetyPack>(file.readText()))
    }
}
