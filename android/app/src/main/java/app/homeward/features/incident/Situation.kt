package app.homeward.features.incident

import kotlinx.serialization.Serializable

// The kind of trouble she is in. It picks the checklist she sees; nothing else depends on it.
@Serializable
enum class Situation(val key: String) {
    Lost("lost"), Followed("followed"), Vehicle("vehicle"), Medical("medical"), Harassment("harassment"), Other("other");

    companion object {
        fun fromKey(key: String?): Situation? = entries.firstOrNull { it.key == key?.trim()?.lowercase() }
    }
}

// PURE LOGIC, no AI: works out the situation from her words by looking for key words.
// This is the fallback when the on-device model is missing, and the answer the model's pick is checked
// against. Order matters: the more urgent situation wins when two match ("lost and someone is following me").
// Tested in SituationTest and shared/test-vectors/situation.json.
object SituationPicker {
    private val words = listOf(
        Situation.Medical to listOf("hurt", "bleed", "injur", "sick", "faint", "breath", "ambulance", "hospital", "doctor", "pain", "unconscious", "allerg"),
        Situation.Vehicle to listOf("vehicle", "taxi", "uber", "driver", "car ", "in a car", "van ", "bus ", "won't stop", "wont stop", "wrong way", "let me out"),
        Situation.Followed to listOf("follow", "stalk", "behind me", "chasing", "watching me"),
        Situation.Harassment to listOf("harass", "touch", "grab", "grop", "shout", "threat", "leave me alone", "won't leave", "wont leave", "cornered"),
        Situation.Lost to listOf("lost", "don't know where", "dont know where", "can't find", "cant find", "no idea where"),
    )

    fun pick(description: String): Situation {
        val text = " ${description.lowercase()} "
        return words.firstOrNull { (_, keys) -> keys.any { text.contains(it) } }?.first ?: Situation.Other
    }
}
