package app.homeward.features.sync

import android.content.Context
import java.util.UUID

// Remembers this phone's trip id and share id, so every SOS on this trip uses the same family link.
// Both are random and made on the phone; nothing here needs a connection.
class TripStore(context: Context) {
    private val prefs = context.getSharedPreferences("trip", Context.MODE_PRIVATE)

    val tripId: String get() = remembered("trip_id") { UUID.randomUUID().toString() }
    val shareId: String get() = remembered("share_id") { FamilyLink.newShareId() }
    val createdAtMillis: Long get() = prefs.getLong("created", 0).takeIf { it > 0 } ?: System.currentTimeMillis().also { prefs.edit().putLong("created", it).apply() }

    private fun remembered(key: String, make: () -> String): String =
        prefs.getString(key, null) ?: make().also { prefs.edit().putString(key, it).apply() }
}
