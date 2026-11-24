package app.homeward.features.scancheck

import android.content.Context
import app.homeward.ai.AiModels
import app.homeward.ai.ask
import app.homeward.app.AppServices
import java.time.LocalDate

// CLOUD-ONLY: researches the scams travelers report for the saved pack's city (Gemini + Google Search,
// Reddit threads included) and saves them into the pack, so the scan check works offline later.
// Called from PackUpdater while online. Never throws: if anything fails, the pack stays as it was.
object ScamResearcher {
    private const val PREFS = "scam_research"
    private const val LAST_TRY = "lastTryMillis_" // per city, so a new city is researched right away

    suspend fun researchIfNeeded(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val pack = AppServices.packStore.load()
        val now = System.currentTimeMillis()
        if (!ScamResearchSchedule.shouldTry(pack, prefs.getLong(LAST_TRY + pack.city, 0L), now, AppServices.network.hasInternet())) return
        prefs.edit().putLong(LAST_TRY + pack.city, now).apply()
        val answer = runCatching { AiModels.cloudResearch.ask(ScamResearchPrompt.forCity(pack.city, pack.country, LocalDate.now().toString())) }
            .getOrNull() ?: return
        val scams = ScamResearchParser.parse(answer.text)
        if (scams.isEmpty()) return
        val latest = AppServices.packStore.load()
        if (latest.city == pack.city) AppServices.packStore.save(latest.copy(scams = scams)) // the city may have changed meanwhile
    }
}
