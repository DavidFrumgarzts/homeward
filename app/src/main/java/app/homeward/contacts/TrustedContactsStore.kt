package app.homeward.contacts

import android.content.Context
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

// Saves trusted contacts on the phone (no account, no server). Works offline.
class TrustedContactsStore(context: Context) {
    private val prefs = context.getSharedPreferences("trusted_contacts", Context.MODE_PRIVATE)

    // Empty until the user adds people (onboarding step 2 makes sure there's at least one).
    fun all(): List<TrustedContact> =
        prefs.getString(KEY, null)?.let { Json.decodeFromString<List<TrustedContact>>(it) } ?: emptyList()

    fun save(contacts: List<TrustedContact>) = prefs.edit().putString(KEY, Json.encodeToString(contacts)).apply()

    private companion object {
        const val KEY = "list"
    }
}
