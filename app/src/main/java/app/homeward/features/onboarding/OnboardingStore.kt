package app.homeward.features.onboarding

import android.content.Context

// Remembers that onboarding is finished, so it only shows on first launch.
class OnboardingStore(context: Context) {
    private val prefs = context.getSharedPreferences("onboarding", Context.MODE_PRIVATE)
    fun isDone(): Boolean = prefs.getBoolean("done", false)
    fun markDone() = prefs.edit().putBoolean("done", true).apply()
}
