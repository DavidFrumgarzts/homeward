package app.homeward.features.sos

import app.homeward.profile.Pronoun
import app.homeward.profile.UserProfile

// PURE LOGIC: the instructions given to the model to turn a panicked note into one clear sentence.
// Rule from past winners: the small model only REWRITES what she said. It must not invent facts.
// It is never shown her location, the police number or the family link, and never asked to write
// them: IncidentMessages adds those by code. Tested in SosMessageWriterTest.
object SosPrompt {
    fun build(profile: UserProfile, note: String): String {
        val name = profile.displayName
        val refer = when (profile.pronoun) {
            Pronoun.She -> "Use \"she\" and \"her\" after the first mention."
            Pronoun.He -> "Use \"he\" and \"him\" after the first mention."
            Pronoun.They -> "Use \"they\" and \"them\" after the first mention."
            Pronoun.UseName -> "Use the name each time; do not use \"he\" or \"she\"."
        }
        return """
            Rewrite this emergency note as one or two clear sentences for the person's family. At most 40 words.
            Write in the third person about $name. $refer
            Keep every fact from the note. Do NOT add facts, places, numbers, advice or greetings.
            Answer with the sentences only.
            Note from $name: "$note"
        """.trimIndent()
    }
}
