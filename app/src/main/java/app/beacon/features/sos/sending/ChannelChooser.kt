package app.beacon.features.sos.sending

// PURE LOGIC: pick how to send. With internet -> push (fast, free). Without -> SMS (works on weak signal).
// Tested in ChannelChooserTest.
object ChannelChooser {
    fun choose(hasInternet: Boolean, contactHasApp: Boolean): SendChannel = when {
        hasInternet && contactHasApp -> SendChannel.Push
        hasInternet -> SendChannel.Sms
        else -> SendChannel.SmsNoData
    }
}
