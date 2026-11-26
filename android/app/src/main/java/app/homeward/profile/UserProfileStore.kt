package app.homeward.profile

import android.content.Context
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

// Saves the traveler's profile on the phone (no account, no server).
class UserProfileStore(context: Context) {
    private val prefs = context.getSharedPreferences("profile", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    fun load(): UserProfile =
        prefs.getString(KEY, null)?.let { runCatching { json.decodeFromString<UserProfile>(it) }.getOrNull() } ?: UserProfile()

    fun save(profile: UserProfile) = prefs.edit().putString(KEY, json.encodeToString(profile)).apply()

    private companion object {
        const val KEY = "profile"
    }
}
