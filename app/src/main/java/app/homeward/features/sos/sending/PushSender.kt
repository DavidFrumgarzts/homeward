package app.homeward.features.sos.sending

// Sends the SOS as a push notification to a contact who also has Homeward.
// NOT BUILT YET: phones can't push to each other directly. This needs a small Cloud Function
// that receives the SOS and sends it with Firebase Cloud Messaging. Until then this returns
// false and the dispatcher falls back to SMS, so nothing is lost.
class PushSender {
    @Suppress("UNUSED_PARAMETER")
    fun send(contactPhone: String, message: String): Boolean = false
}
