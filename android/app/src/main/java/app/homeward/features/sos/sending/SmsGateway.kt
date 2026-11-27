package app.homeward.features.sos.sending

import app.homeward.features.incident.contracts.DeliveryStatus

// One text to one phone number, reporting what the radio says happened to it:
//   Sent             the network accepted it
//   Delivered        the other phone confirmed it (not every carrier reports this)
//   WaitingForSignal the radio had no service; nothing went out, try again later
//   Failed           it could not be sent
// SmsSender is the real one. Debug builds can swap in a fake that sends nothing (app/src/debug).
interface SmsGateway {
    fun send(phone: String, text: String, onStatus: (DeliveryStatus) -> Unit)
}

// For simple one-off texts ("I'm OK", safety photo notes): true unless it failed straight away.
fun SmsGateway.handOff(phone: String, text: String): Boolean {
    var failed = false
    send(phone, text) { if (it == DeliveryStatus.Failed) failed = true }
    return !failed
}

// What a queued message is for. Only the alert's delivery is shown per contact on the SOS screen.
@kotlinx.serialization.Serializable
enum class MessageKind { Alert, Update, BatteryLow, Ended }
