package app.homeward.testmode

import android.os.Handler
import android.os.Looper
import android.util.Log
import app.homeward.features.incident.contracts.DeliveryStatus
import app.homeward.features.sos.sending.SmsGateway

// DEBUG BUILDS ONLY. Pretends to be the phone's radio: nothing is sent. Each text is logged
// (Logcat tag "BeaconTestSms"), reported as sent after about a second and as delivered after three.
// The outbox still checks for signal first, so airplane mode shows "Saved on your phone" here too.
class FakeSmsGateway(private val onText: (String) -> Unit) : SmsGateway {
    private val main = Handler(Looper.getMainLooper())
    private val seen = HashSet<String>()

    override fun send(phone: String, text: String, onStatus: (DeliveryStatus) -> Unit) {
        Log.i("BeaconTestSms", "TEST MODE, not sent. To $phone:\n$text")
        if (seen.add(text)) main.post { onText(text) } // the same text goes to every contact; list it once
        main.postDelayed({ onStatus(DeliveryStatus.Sent) }, 1_200)
        main.postDelayed({ onStatus(DeliveryStatus.Delivered) }, 3_000)
    }
}
