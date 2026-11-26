package app.homeward.features.sync

import java.security.SecureRandom
import java.util.Random

// PURE LOGIC: the link a trusted contact opens to follow an SOS live in the browser.
// The share id is 128 random bits made on the phone, so the link can go into an SMS before the phone
// has any connection. Knowing the link is the permission (see shared/schema/README.md).
// Tested in IncidentDocsTest.
object FamilyLink {
    const val HOST = "https://homeward-6999c.web.app" // Firebase Hosting for the team's project

    fun of(shareId: String): String = "$HOST/f/$shareId"

    // 32 lowercase hex characters. `random` is a parameter so tests can make it predictable.
    fun newShareId(random: Random = SecureRandom()): String =
        ByteArray(16).also(random::nextBytes).joinToString("") { "%02x".format(it) }
}
