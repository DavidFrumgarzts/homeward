package app.homeward.profile

import kotlinx.serialization.Serializable

// How messages refer to her after the first mention. UseName is the default: no pronoun is assumed.
@Serializable
enum class Pronoun { UseName, She, He, They }

// The little Beacon knows about the traveler: the name family will recognise, how to refer to her,
// and (optional) her nationality, used only to find the right embassy when a pack is built.
// PURE LOGIC, tested in IncidentMessagesTest through the messages that use it.
@Serializable
data class UserProfile(val name: String = "", val pronoun: Pronoun = Pronoun.UseName, val nationality: String = "") {
    // Used where a name must appear even if she never typed one.
    val displayName: String get() = name.trim().ifBlank { "Your contact" }

    // "Call her now" / "Call Noa now"
    val objectForm: String get() = when (pronoun) {
        Pronoun.She -> "her"; Pronoun.He -> "him"; Pronoun.They -> "them"; Pronoun.UseName -> displayName
    }

    // "sharing her location" / "sharing Noa's location"
    val possessive: String get() = when (pronoun) {
        Pronoun.She -> "her"; Pronoun.He -> "his"; Pronoun.They -> "their"; Pronoun.UseName -> "$displayName's"
    }
}
