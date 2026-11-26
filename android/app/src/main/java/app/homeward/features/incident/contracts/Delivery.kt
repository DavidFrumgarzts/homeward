package app.homeward.features.incident.contracts

import app.homeward.features.sos.sending.SendChannel
import kotlinx.serialization.Serializable

// What really happened to a message for one contact. "Sent" and "Delivered" are only ever set when
// the phone's radio confirms them; until then a message is on the phone, waiting.
@Serializable
enum class DeliveryStatus { SavedOnPhone, WaitingForSignal, Sent, Delivered, Failed }

@Serializable
data class ContactDelivery(val contactName: String, val channel: SendChannel, val status: DeliveryStatus, val updatedAtMillis: Long)
