package app.homeward.features.sos.sending

import app.homeward.features.incident.contracts.DeliveryStatus
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

// Every SOS text waits here until the radio has taken it, one entry per contact. Saved to a file,
// so a message written with no signal is still there after the app closes (same idea as PhotoOutbox).
// Takes the file as a parameter so tests can use a temporary one. Tested in SosOutboxTest.
class SosOutbox(private val file: File) {
    @Serializable
    data class Entry(
        val id: String,
        val incidentId: String,
        val kind: MessageKind,
        val contactName: String,
        val phone: String,
        val text: String,
        val channel: SendChannel,
        val createdAtMillis: Long,
        val status: DeliveryStatus = DeliveryStatus.SavedOnPhone,
        val updatedAtMillis: Long = createdAtMillis,
    ) {
        val stillOnPhone: Boolean get() = status == DeliveryStatus.SavedOnPhone || status == DeliveryStatus.WaitingForSignal
    }

    private val json = Json { ignoreUnknownKeys = true }

    @Synchronized fun all(): List<Entry> = runCatching { json.decodeFromString<List<Entry>>(file.readText()) }.getOrDefault(emptyList())

    @Synchronized fun add(entries: List<Entry>) = write(all() + entries)

    // Records what the radio said. Never moves backwards: a late "sent" cannot undo "delivered",
    // and "waiting for signal" cannot undo "sent". Returns the changed entry, or null if nothing changed.
    @Synchronized fun setStatus(id: String, status: DeliveryStatus, nowMillis: Long): Entry? {
        val entries = all()
        val old = entries.firstOrNull { it.id == id } ?: return null
        val backwards = old.status == DeliveryStatus.Delivered || (old.status == DeliveryStatus.Sent && status != DeliveryStatus.Delivered)
        if (backwards || old.status == status) return null
        val changed = old.copy(status = status, updatedAtMillis = nowMillis)
        write(entries.map { if (it.id == id) changed else it })
        return changed
    }

    // Drops finished entries older than a day, so the file stays small. Unsent ones are never dropped.
    @Synchronized fun prune(nowMillis: Long) = write(all().filter { it.stillOnPhone || nowMillis - it.updatedAtMillis < KEEP_MILLIS })

    private fun write(list: List<Entry>) = file.writeText(json.encodeToString(list))

    private companion object {
        const val KEEP_MILLIS = 24 * 60 * 60_000L
    }
}
