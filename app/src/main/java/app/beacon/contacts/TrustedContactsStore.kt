package app.beacon.contacts

import android.content.Context
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

// Saves trusted contacts on the phone (no account, no server). Works offline.
class TrustedContactsStore(context: Context) {
    private val prefs = context.getSharedPreferences("trusted_contacts", Context.MODE_PRIVATE)

    fun all(): List<TrustedContact> =
        prefs.getString(KEY, null)?.let { Json.decodeFromString<List<TrustedContact>>(it) } ?: DEMO

    fun save(contacts: List<TrustedContact>) = prefs.edit().putString(KEY, Json.encodeToString(contacts)).apply()

    private companion object {
        const val KEY = "list"
        // Demo contacts until the Contacts screen exists. Replace numbers with real test phones.
        val DEMO = listOf(
            TrustedContact("Mom", "+15555550101"),
            TrustedContact("Dad", "+15555550102"),
            TrustedContact("Alwis", "+15555550103"),
        )
    }
}
