package app.beacon.features.safetyphoto

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

// Holds safety photo notes until there is a connection, then they go to family automatically.
// Saved to a file so nothing is lost if the app closes.
class PhotoOutbox(context: Context) {
    @Serializable
    data class Entry(val description: String, val lat: Double?, val lng: Double?, val timeMillis: Long)

    private val file = File(context.filesDir, "photo_outbox.json")

    fun add(entry: Entry) = write(pending() + entry)

    fun pending(): List<Entry> =
        runCatching { Json.decodeFromString<List<Entry>>(file.readText()) }.getOrDefault(emptyList())

    // Call when the phone is back online. `send` returns true when an entry went out.
    fun flush(send: (Entry) -> Boolean) = write(pending().filterNot(send))

    private fun write(list: List<Entry>) = file.writeText(Json.encodeToString(list))
}
