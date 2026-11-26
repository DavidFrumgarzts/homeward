package app.homeward.device

import android.content.Context
import android.os.VibrationEffect
import android.os.Vibrator

// Short buzz so you notice a red-zone warning with the phone in your pocket.
class Haptics(private val context: Context) {
    fun warn() {
        val v = context.getSystemService(Vibrator::class.java) ?: return
        v.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 250, 150, 250), -1)) // two pulses
    }
}
