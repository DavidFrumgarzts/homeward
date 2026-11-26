package app.homeward.features.sos.sending

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import app.homeward.features.incident.contracts.DeliveryStatus
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

// Hears back from the phone's radio about each text SmsSender handed over, and turns that into
// Sent / Delivered / WaitingForSignal / Failed. A long text is several parts: it is Sent when every
// part was accepted and Delivered when every part was confirmed.
// Registered once in HomewardApplication. Only this app can trigger it (not exported).
object SmsStatusReceiver : BroadcastReceiver() {
    const val ACTION_SENT = "app.homeward.SMS_SENT"
    const val ACTION_DELIVERED = "app.homeward.SMS_DELIVERED"
    const val EXTRA_ID = "id"

    private class Waiting(val parts: Int, val onStatus: (DeliveryStatus) -> Unit, var sent: Int = 0, var delivered: Int = 0)
    private val waiting = ConcurrentHashMap<Int, Waiting>()
    private val nextId = AtomicInteger(1)

    fun register(context: Context) {
        val filter = IntentFilter().apply { addAction(ACTION_SENT); addAction(ACTION_DELIVERED) }
        ContextCompat.registerReceiver(context, this, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
    }

    fun expect(parts: Int, onStatus: (DeliveryStatus) -> Unit): Int = nextId.getAndIncrement().also { waiting[it] = Waiting(parts, onStatus) }
    fun forget(id: Int) { waiting.remove(id) }

    override fun onReceive(context: Context, intent: Intent) {
        val id = intent.getIntExtra(EXTRA_ID, -1)
        val w = waiting[id] ?: return
        when (intent.action) {
            ACTION_SENT -> when (resultCode) {
                Activity.RESULT_OK -> if (++w.sent == w.parts) w.onStatus(DeliveryStatus.Sent)
                // No service or radio off: nothing left the phone. The outbox keeps it and tries again.
                SmsManager.RESULT_ERROR_NO_SERVICE, SmsManager.RESULT_ERROR_RADIO_OFF -> { waiting.remove(id); w.onStatus(DeliveryStatus.WaitingForSignal) }
                else -> { waiting.remove(id); w.onStatus(DeliveryStatus.Failed) }
            }
            ACTION_DELIVERED -> if (++w.delivered == w.parts) { waiting.remove(id); w.onStatus(DeliveryStatus.Delivered) }
        }
    }
}
