package app.homeward.features.sos

import app.homeward.features.incident.contracts.ContactDelivery
import app.homeward.features.incident.contracts.DeliveryStatus

// PURE LOGIC: the honest words on the "SOS sent" screen. "Mom knows" (and the green tick) is only
// ever said for a message the phone's radio reported as delivered. Everything else says exactly
// where the message is: on the phone, sent and waiting, or failed.
// Tested in DeliveryWordingTest and shared/test-vectors/delivery-wording.json.
object DeliveryWording {
    data class Summary(val headline: String, val lines: List<String>, val anyDelivered: Boolean)

    fun summarize(deliveries: List<ContactDelivery>): Summary {
        fun names(vararg status: DeliveryStatus) = deliveries.filter { it.status in status }.map { it.contactName }
        val delivered = names(DeliveryStatus.Delivered)
        val sent = names(DeliveryStatus.Sent)
        val waiting = names(DeliveryStatus.SavedOnPhone, DeliveryStatus.WaitingForSignal)
        val failed = names(DeliveryStatus.Failed)

        val headline = when {
            deliveries.isEmpty() -> "No one to send to yet"
            delivered.isNotEmpty() -> "${joinNames(delivered)} ${if (delivered.size == 1) "knows" else "know"}"
            sent.isNotEmpty() -> "Sent to ${joinNames(sent)}"
            waiting.isNotEmpty() -> "Saved on your phone"
            else -> "SOS not sent"
        }
        val lines = buildList {
            if (deliveries.isEmpty()) add("Add a trusted contact, and call the police if you are in danger.")
            if (sent.isNotEmpty()) add(if (delivered.isEmpty()) "Waiting for delivery." else "Sent to ${joinNames(sent)}, waiting for delivery.")
            if (waiting.isNotEmpty()) add(if (delivered.isEmpty() && sent.isEmpty()) "It sends when you have signal." else "Saved on your phone for ${joinNames(waiting)}. It sends when you have signal.")
            if (failed.isNotEmpty()) add("Couldn't send to ${joinNames(failed)}. Call them, or call the police.")
        }
        return Summary(headline, lines, anyDelivered = delivered.isNotEmpty())
    }

    // "Mom", "Mom and Dad", "Mom, Dad and Alwis"
    fun joinNames(names: List<String>): String = when (names.size) {
        0 -> ""
        1 -> names[0]
        else -> names.dropLast(1).joinToString(", ") + " and " + names.last()
    }
}
