package app.homeward.features.sos.sending

import kotlinx.serialization.Serializable

// How a message travels to one contact. Shown on the "SOS sent" screen.
@Serializable
enum class SendChannel(val label: String) {
    Push("Push"),
    Sms("SMS"),
    SmsNoData("SMS (no data)"),
}
