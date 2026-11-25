package app.homeward.features.incident

import app.homeward.features.safetypack.Phrase

// PURE LOGIC: picks which reviewed phrase from the pack to show a stranger ("Show someone nearby").
// It only ever returns a phrase that is already in the pack; nothing is translated here.
// The phrase whose English shares the most words with her description wins, then the one that fits
// her situation; with no match it is the first phrase in the pack (packs start with "Help!").
// Tested in PhrasePickerTest and shared/test-vectors/phrase-picker.json.
object PhrasePicker {
    // Words that point to a phrase even when she didn't type them.
    private val hints = mapOf(
        Situation.Followed to setOf("followed", "following"),
        Situation.Medical to setOf("hospital", "doctor", "ambulance"),
        Situation.Vehicle to setOf("stop", "police"),
        Situation.Harassment to setOf("alone", "police"),
        Situation.Lost to setOf("lost", "where"),
        Situation.Other to setOf("help"),
    )

    fun pick(description: String, situation: Situation, phrases: List<Phrase>): Phrase? {
        if (phrases.isEmpty()) return null
        val said = words(description).filter { it.length > 3 }.toSet()
        val hinted = hints.getValue(situation)
        // Her own words count double: what she typed is a stronger signal than the situation's hint.
        fun score(phrase: Phrase) = words(phrase.english).sumOf { word -> if (word in said) 2 else if (word in hinted) 1 else 0 as Int }
        val best = phrases.maxBy(::score) // the first of the best, so pack order breaks ties
        return if (score(best) == 0) phrases.first() else best
    }

    private fun words(text: String): List<String> = text.lowercase().split(Regex("[^a-z']+")).filter { it.isNotBlank() }
}
