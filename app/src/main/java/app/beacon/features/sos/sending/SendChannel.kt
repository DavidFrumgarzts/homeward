package app.beacon.features.sos.sending

// How an SOS reached one contact. Shown on the "SOS sent" screen.
enum class SendChannel(val label: String) {
    Push("Push"),
    Sms("SMS"),
    SmsNoData("SMS (no data)"),
}

// The result for one contact.
data class SendResult(val contactName: String, val channel: SendChannel, val delivered: Boolean)
