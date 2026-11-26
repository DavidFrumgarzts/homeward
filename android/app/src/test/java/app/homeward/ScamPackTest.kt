package app.homeward

import app.homeward.features.scancheck.FairRate
import app.homeward.features.scancheck.ScamKind
import app.homeward.features.safetypack.DemoBucharestPack
import app.homeward.features.safetypack.DemoRioPack
import app.homeward.features.safetypack.SafetyPack
import kotlinx.serialization.json.Json
import org.junit.Assert.*
import org.junit.Test

// Scam warnings live in the pack. Old packs (saved before this field existed) must still load.
class ScamPackTest {
    @Test fun oldPackWithoutScamsStillLoads() {
        val old = """{"city":"Rio de Janeiro","country":"Brazil","police":"190","ambulance":"192",
            "embassyName":"x","embassyPhone":"1","localPhrases":[],"safePlaces":[],"zones":[],"builtAtMillis":0}"""
        val pack = Json { ignoreUnknownKeys = true }.decodeFromString<SafetyPack>(old)
        assertTrue(pack.scams.isEmpty())
    }

    @Test fun rioDemoHasScams() {
        val scams = DemoRioPack.pack.scams
        assertTrue(scams.size in 4..6)
        assertTrue(scams.all { it.sources.isNotEmpty() })
    }

    @Test fun bucharestDemoHasAFairEuroRate() {
        val money = DemoBucharestPack.pack.scams.filter { it.kind == ScamKind.Money }
        assertTrue(money.any { FairRate("EUR", "RON", 4.97, 8) in it.fairRates })
    }

    @Test fun bucharestSaferOptionIsAPackPlace() {
        val pack = DemoBucharestPack.pack
        val names = pack.safePlaces.map { it.name }
        assertTrue(pack.scams.filter { it.saferOption.isNotBlank() }.all { it.saferOption in names })
    }
}
