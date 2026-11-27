package app.homeward.features.sos.sending

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.telephony.SmsManager
import app.homeward.features.incident.contracts.DeliveryStatus

// Sends a normal text message. Works with no mobile data; it only needs cell signal.
// Android lets apps send SMS directly (with SEND_SMS permission), so no extra tap is needed.
// Every part of a long text gets a "sent" and a "delivered" callback from the phone's radio
// (SmsStatusReceiver collects them), so the app only says Sent or Delivered when that is true.
class SmsSender(private val context: Context) : SmsGateway {
    override fun send(phone: String, text: String, onStatus: (DeliveryStatus) -> Unit) {
        val sms = context.getSystemService(SmsManager::class.java)
        if (sms == null) { onStatus(DeliveryStatus.Failed); return }
        val parts = sms.divideMessage(text)
        val id = SmsStatusReceiver.expect(parts.size, onStatus)
        fun callbacks(action: String) = ArrayList(parts.indices.map { part ->
            val intent = Intent(action).setPackage(context.packageName).putExtra(SmsStatusReceiver.EXTRA_ID, id)
            PendingIntent.getBroadcast(context, id * MAX_PARTS + part, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_ONE_SHOT)
        })
        runCatching { sms.sendMultipartTextMessage(phone, null, parts, callbacks(SmsStatusReceiver.ACTION_SENT), callbacks(SmsStatusReceiver.ACTION_DELIVERED)) }
            .onFailure { SmsStatusReceiver.forget(id); onStatus(DeliveryStatus.Failed) } // e.g. SEND_SMS was denied
    }

    private companion object {
        const val MAX_PARTS = 32 // keeps each part's callback distinct
    }
}
