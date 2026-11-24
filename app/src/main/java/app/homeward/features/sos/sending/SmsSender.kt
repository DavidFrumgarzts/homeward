package app.homeward.features.sos.sending

import android.content.Context
import android.telephony.SmsManager

// Sends the SOS as a normal text message. Works with no mobile data, only basic signal needed.
// Android lets apps send SMS directly (with SEND_SMS permission), so no extra tap is needed.
class SmsSender(private val context: Context) {
    fun send(phone: String, message: String): Boolean = runCatching {
        val sms = context.getSystemService(SmsManager::class.java)
        sms.sendMultipartTextMessage(phone, null, sms.divideMessage(message), null, null)
    }.isSuccess
}
