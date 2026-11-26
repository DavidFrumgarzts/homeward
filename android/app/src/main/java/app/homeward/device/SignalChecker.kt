package app.homeward.device

import android.content.Context
import android.os.Build
import android.provider.Settings
import android.telephony.TelephonyManager

// Answers one question: could a text message leave the phone right now?
// SMS needs cell signal, not data. This is a best guess (airplane mode off, a SIM that is ready,
// some signal); the radio's own answer when a text is sent is what the app finally trusts.
class SignalChecker(private val context: Context) {
    fun canSendSms(): Boolean {
        val airplane = Settings.Global.getInt(context.contentResolver, Settings.Global.AIRPLANE_MODE_ON, 0) != 0
        if (airplane) return false
        val phone = context.getSystemService(TelephonyManager::class.java) ?: return false
        if (phone.simState != TelephonyManager.SIM_STATE_READY) return false
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return true // can't read signal bars before Android 9
        return (runCatching { phone.signalStrength?.level }.getOrNull() ?: 1) > 0
    }
}
