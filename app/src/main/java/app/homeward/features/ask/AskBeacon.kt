package app.homeward.features.ask

import app.homeward.ai.AiAnswer
import app.homeward.ai.AiModels
import app.homeward.ai.ask
import app.homeward.app.AppServices
import java.util.Calendar

// HYBRID AI: answers a question from the saved safety pack. Runs on the phone when it can
// (so it works with no signal) and falls back to the cloud. Never throws: if the AI fails,
// you still get the saved emergency numbers.
object AskBeacon {
    suspend fun answer(question: String, earlier: List<Pair<String, String>> = emptyList()): AiAnswer {
        val pack = AppServices.packStore.load()
        val prompt = AskBeaconPrompt.build(question, pack, AppServices.location.lastKnown(), Calendar.getInstance().get(Calendar.HOUR_OF_DAY), earlier)
        val ai = runCatching { AiModels.hybrid.ask(prompt) }.getOrNull()
        return if (ai == null || ai.text.isBlank()) AiAnswer(AskBeaconPrompt.fallback(pack), ranOnDevice = false, fromAi = false) else ai
    }
}
