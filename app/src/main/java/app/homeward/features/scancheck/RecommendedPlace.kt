package app.homeward.features.scancheck

import app.homeward.device.GeoPoint
import app.homeward.features.safeplace.SafePlacePicker
import app.homeward.features.safetypack.SafePlace
import app.homeward.features.safetypack.SafetyPack
import java.text.Normalizer
import java.util.Locale

// PURE LOGIC: which saved place Beacon recommends, decided in code, never read out of the AI's words.
// Ask Beacon tells the model to name this place first, and "Show on map" makes it blink yellow on Home.
// Tested in RecommendedPlaceTest.
object RecommendedPlace {
    private val goWords = setOf("safe", "where", "go", "help", "hostel", "hospital", "walk")

    // A place only when the question is about where to go or what to do; "what's the police number?" gets none.
    fun pick(question: String, pack: SafetyPack, here: GeoPoint?, hour: Int): SafePlace? {
        val q = plain(question)
        val words = q.split(Regex("[^a-z0-9]+")).toSet()
        if (words.intersect(goWords).isEmpty() && !q.contains("police station")) return null
        return if (here != null) SafePlacePicker.pick(here, pack.safePlaces, hour)?.place
        else pack.safePlaces.firstOrNull { SafePlacePicker.isOpen(it, hour) }
    }

    // Finds a saved place by name, ignoring case and accents (used for a scan's safer option and Home's route).
    fun byName(name: String, pack: SafetyPack): SafePlace? = pack.safePlaces.firstOrNull { plain(it.name) == plain(name) }

    private fun plain(s: String) =
        Normalizer.normalize(s, Normalizer.Form.NFD).replace(Regex("\\p{M}+"), "").lowercase(Locale.ROOT).trim()
}
