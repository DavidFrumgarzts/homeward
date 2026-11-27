package app.homeward.features.sos

import android.content.Context

// Remembers when the last SOS was sent, so background work (scam research) stays quiet right after one.
// A stand-in until the build prompt's incident state machine (IncidentPhase) exists; then read that instead.
class SosLog(context: Context) {
    private val prefs = context.getSharedPreferences("sos", Context.MODE_PRIVATE)

    fun markSent(nowMillis: Long = System.currentTimeMillis()) = prefs.edit().putLong(KEY, nowMillis).apply()

    fun lastSentMillis(): Long? = prefs.getLong(KEY, 0L).takeIf { it > 0L }

    private companion object { const val KEY = "lastSentMillis" }
}
