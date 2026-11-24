package app.homeward

import app.homeward.features.safetypack.DemoBucharestPack
import app.homeward.features.scancheck.ScamResearchParser
import app.homeward.features.scancheck.ScamResearchPrompt
import app.homeward.features.scancheck.ScamResearchSchedule
import org.junit.Assert.*
import org.junit.Test

// Online scam research: what we ask the cloud model, when we ask, and that a bad answer never breaks the pack.
class ScamResearchTest {
    private val hour = 60 * 60 * 1000L
    private val noScams = DemoBucharestPack.pack.copy(scams = emptyList())

    @Test fun promptAsksForSourcedTravelerReports() {
        val p = ScamResearchPrompt.forCity("Bucharest", "Romania", "2026-11-24")
        listOf("Reddit", "Bucharest", "sources", "Never describe people").forEach { assertTrue("missing $it", p.contains(it)) }
    }

    @Test fun triesWhenOnlineAndNoScamsAndNotTriedToday() = assertTrue(ScamResearchSchedule.shouldTry(noScams, 0L, 25 * hour, online = true))
    @Test fun notOffline() = assertFalse(ScamResearchSchedule.shouldTry(noScams, 0L, 25 * hour, online = false))
    @Test fun notWhenScamsSaved() = assertFalse(ScamResearchSchedule.shouldTry(DemoBucharestPack.pack, 0L, 25 * hour, online = true))
    @Test fun notTwiceADay() = assertFalse(ScamResearchSchedule.shouldTry(noScams, 23 * hour, 25 * hour, online = true))

    @Test fun brokenAnswerIsEmpty() = assertTrue(ScamResearchParser.parse("Sorry, I couldn't find anything.").isEmpty())

    @Test fun itemWithoutSourcesIsDroppedAndValidItemKept() {
        val text = """```json
            {"scams":[
              {"title":"No source","kind":"Money","where":"x","signs":["a"],"whatToDo":"y","level":"Avoid","sources":[]},
              {"title":"0% commission boards","kind":"Money","where":"Old Town","signs":["0% commission"],"whatToDo":"Use a bank ATM",
               "level":"Avoid","fairRates":[{"from":"EUR","to":"RON","rate":4.97}],"sources":["https://www.reddit.com/r/Romania/x"],"reports":3},
              {"title":"Broken item","kind":"Spaceship"}
            ]}```"""
        val scams = ScamResearchParser.parse(text)
        assertEquals(listOf("0% commission boards"), scams.map { it.title })
        assertEquals(4.97, scams.single().fairRates.single().rate, 0.0001)
    }
}
