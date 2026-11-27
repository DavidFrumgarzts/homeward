package app.homeward.device

import android.content.Context
import android.os.BatteryManager

// The phone's battery level, 0 to 100. Used to send one "battery low" update during an SOS.
class BatteryReader(private val context: Context) {
    fun percent(): Int =
        context.getSystemService(BatteryManager::class.java)?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)?.takeIf { it in 0..100 } ?: 100
}
