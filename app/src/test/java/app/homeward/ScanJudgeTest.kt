package app.homeward

import app.homeward.features.safetypack.DemoBucharestPack
import app.homeward.features.scancheck.BoardRate
import app.homeward.features.scancheck.FairPrice
import app.homeward.features.scancheck.ScamKind
import app.homeward.features.scancheck.ScamLevel
import app.homeward.features.scancheck.ScamWarning
import app.homeward.features.scancheck.ScanJudge
import app.homeward.features.scancheck.ScanReading
import app.homeward.features.scancheck.SeenPrice
import app.homeward.features.scancheck.Verdict
import org.junit.Assert.*
import org.junit.Test

// The verdict is plain math against numbers saved in the pack. The AI never decides it.
class ScanJudgeTest {
    private val bucharest = DemoBucharestPack.pack
    private val giza = bucharest.copy(
        city = "Giza", scams = listOf(
            ScamWarning(
                title = "Camel ride price that changes halfway", kind = ScamKind.Tour, where = "Pyramids plateau",
                signs = listOf("camel ride", "price changes after you get on"), whatToDo = "Agree the full price, in writing, before you get on.",
                level = ScamLevel.Avoid, fairPrices = listOf(FairPrice("camel ride", "EGP", 300.0, 500.0)), sources = listOf("https://example.org"),
            ),
        ),
    )

    private fun money(rate: BoardRate, text: String = "") = ScanReading(ScamKind.Money, text, rates = listOf(rate))
    private fun camel(amount: Double) = ScanReading(ScamKind.Tour, "camel ride", prices = listOf(SeenPrice("camel ride", "EGP", amount)))

    @Test fun buy420IsWalkAway() {
        val v = ScanJudge.judge(money(BoardRate("EUR", "RON", buy = 4.20)), bucharest)
        assertEquals(Verdict.WalkAway, v.verdict)
        listOf("4.20", "4.97", "15%", "420", "497").forEach { assertTrue("why lacks $it: ${v.why}", v.why.contains(it)) }
        assertEquals("BCR bank ATM, Bd. Regina Elisabeta", v.saferOption)
    }

    @Test fun buy470IsBeCareful() = assertEquals(Verdict.BeCareful, ScanJudge.judge(money(BoardRate("EUR", "RON", buy = 4.70)), bucharest).verdict)

    @Test fun buy490IsLooksFair() = assertEquals(Verdict.LooksFair, ScanJudge.judge(money(BoardRate("EUR", "RON", buy = 4.90)), bucharest).verdict)

    @Test fun lowerCaseCurrencyMatches() = assertEquals(Verdict.WalkAway, ScanJudge.judge(money(BoardRate("eur", "ron", buy = 4.20)), bucharest).verdict)

    @Test fun onlySellRateOrUnknownPairFallsBackToSigns() {
        val v = ScanJudge.judge(money(BoardRate("GBP", "RON", sell = 6.1), text = "0% commission exchange"), bucharest)
        assertEquals(Verdict.WalkAway, v.verdict) // the "0% commission" warning is level Avoid
        assertNotNull(v.warning)
    }

    @Test fun camel400Fair_700Careful_1500WalkAway() {
        assertEquals(Verdict.LooksFair, ScanJudge.judge(camel(400.0), giza).verdict)
        assertEquals(Verdict.BeCareful, ScanJudge.judge(camel(700.0), giza).verdict)
        assertEquals(Verdict.WalkAway, ScanJudge.judge(camel(1500.0), giza).verdict)
    }

    @Test fun noNumbersNoMatchIsUnknown() {
        val v = ScanJudge.judge(ScanReading(ScamKind.Other, "museum opening hours"), bucharest)
        assertEquals(Verdict.Unknown, v.verdict)
        assertEquals("Nothing saved about this", v.why)
    }

    @Test fun emptyPackIsUnknown() =
        assertEquals(Verdict.Unknown, ScanJudge.judge(money(BoardRate("EUR", "RON", buy = 4.20)), bucharest.copy(scams = emptyList())).verdict)

    @Test fun neverLooksFairWithoutANumber() {
        val v = ScanJudge.judge(ScanReading(ScamKind.Money, "airport exchange no commission"), bucharest)
        assertNotEquals(Verdict.LooksFair, v.verdict)
    }
}
