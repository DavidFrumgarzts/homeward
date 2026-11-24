package app.homeward.testmode

import android.content.Context
import android.os.Build
import app.homeward.features.sos.sending.SmsGateway
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

// DEBUG BUILDS ONLY (this file is in app/src/debug; release builds get the empty one in app/src/release).
// "Test mode: no real SMS": texts go to FakeSmsGateway, which sends nothing and walks each one through
// sent and delivered, so the SOS screens can be checked on an emulator. On by default on an emulator,
// off on a real phone; `adb shell am broadcast` is not needed, the choice is saved in preferences
// (`fake_sms`) and can be flipped with setFakeSms.
object TestMode {
    const val AVAILABLE = true

    private val messages = MutableStateFlow<List<String>>(emptyList())
    // Every text "sent" in test mode, oldest first, so the screen can show what contacts would read.
    val log: StateFlow<List<String>> = messages

    fun fakeSms(context: Context): Boolean = prefs(context).getBoolean("fake_sms", isEmulator())
    fun setFakeSms(context: Context, on: Boolean) = prefs(context).edit().putBoolean("fake_sms", on).apply()

    // The gateway to use instead of the real one, or null to send real texts.
    fun smsGateway(context: Context): SmsGateway? =
        if (fakeSms(context)) FakeSmsGateway { text -> messages.value = messages.value + text } else null

    private fun prefs(context: Context) = context.getSharedPreferences("test_mode", Context.MODE_PRIVATE)

    private fun isEmulator(): Boolean =
        Build.FINGERPRINT.contains("generic") || Build.FINGERPRINT.contains("emulator") || Build.MODEL.contains("sdk_gphone") ||
            Build.HARDWARE.contains("ranchu") || Build.HARDWARE.contains("goldfish")
}
