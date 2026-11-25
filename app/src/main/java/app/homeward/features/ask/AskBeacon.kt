package app.homeward.features.ask

import app.homeward.ai.AiAnswer
import app.homeward.ai.AiModels
import app.homeward.ai.ask
import app.homeward.app.AppServices
import java.util.Calendar

// HYBRID AI: answers a question from the saved safety pack. Runs on the phone when it can
// (so it works with no signal) and falls back to the cloud. Never throws: if no model can answer,
// plain key-word rules answer from the same saved facts (AskBeaconRules), marked "No AI".
object AskBeacon {
    suspend fun answer(question: String, earlier: List<Pair<String, String>> = emptyList()): AiAnswer {
        val pack = AppServices.packStore.load()
        val here = AppServices.location.lastKnown()
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val ai = runCatching { AiModels.hybrid.ask(AskBeaconPrompt.build(question, pack, here, hour, earlier)) }.getOrNull()
        return if (ai == null || ai.text.isBlank()) AiAnswer(AskBeaconRules.answer(question, pack, here, hour), ranOnDevice = false, fromAi = false) else ai
    }
}
