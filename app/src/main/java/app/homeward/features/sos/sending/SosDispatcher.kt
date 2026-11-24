package app.homeward.features.sos.sending

import app.homeward.contacts.TrustedContact
import app.homeward.device.NetworkChecker

// Sends one SOS to every trusted contact, each by the best available channel,
// and falls back to SMS if push fails. Returns what happened per contact for the "sent" screen.
class SosDispatcher(
    private val network: NetworkChecker,
    private val sms: SmsSender,
    private val push: PushSender,
) {
    fun sendToAll(contacts: List<TrustedContact>, message: String): List<SendResult> {
        val online = network.hasInternet()
        return contacts.map { c ->
            when (ChannelChooser.choose(online, contactHasApp = false)) { // TODO: true once contacts sync
                SendChannel.Push ->
                    if (push.send(c.phone, message)) SendResult(c.name, SendChannel.Push, true)
                    else SendResult(c.name, SendChannel.Sms, sms.send(c.phone, message))
                SendChannel.Sms -> SendResult(c.name, SendChannel.Sms, sms.send(c.phone, message))
                SendChannel.SmsNoData -> SendResult(c.name, SendChannel.SmsNoData, sms.send(c.phone, message))
            }
        }
    }
}
