package app.homeward.contacts

import kotlinx.serialization.Serializable

// A person who gets the SOS. Only these people ever see the exact location.
@Serializable
data class TrustedContact(val name: String, val phone: String) {
    val initial: String get() = name.firstOrNull()?.uppercase() ?: "?"
}
