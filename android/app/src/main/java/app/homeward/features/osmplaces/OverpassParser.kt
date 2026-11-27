package app.homeward.features.osmplaces

import app.homeward.features.safetypack.SafePlace
import kotlinx.serialization.json.*

// PURE LOGIC: turns the OpenStreetMap answer (JSON) into SafePlace items for the safety pack.
// Unnamed places get a readable name from their type and street, e.g. "Police (Rua Riachuelo)".
object OverpassParser {
    private val label = mapOf("police" to "Police", "hospital" to "Hospital", "pharmacy" to "Pharmacy", "fuel" to "Gas station")
    private val kindName = mapOf("police" to "police", "hospital" to "hospital", "pharmacy" to "pharmacy", "fuel" to "gas station")

    fun parse(json: String): List<SafePlace> {
        val elements = Json.parseToJsonElement(json).jsonObject["elements"]?.jsonArray ?: return emptyList()
        return elements.mapNotNull { el ->
            val o = el.jsonObject
            val tags = o["tags"]?.jsonObject ?: return@mapNotNull null
            val amenity = tags.str("amenity") ?: return@mapNotNull null
            val lat = o["lat"]?.jsonPrimitive?.doubleOrNull ?: o["center"]?.jsonObject?.get("lat")?.jsonPrimitive?.doubleOrNull ?: return@mapNotNull null
            val lng = o["lon"]?.jsonPrimitive?.doubleOrNull ?: o["center"]?.jsonObject?.get("lon")?.jsonPrimitive?.doubleOrNull ?: return@mapNotNull null
            val hours = OpeningHours.parse(tags.str("opening_hours"), amenity)
            val street = tags.str("addr:street")
            val name = tags.str("name") ?: (label[amenity] ?: amenity) + (street?.let { " ($it)" } ?: "")
            SafePlace(
                name = name,
                kind = kindName[amenity] ?: amenity,
                lat = lat, lng = lng,
                open24h = hours.open24h, opensHour = hours.opensHour, closesHour = hours.closesHour,
                note = if (hours.known) "from OpenStreetMap" else "hours not listed",
            )
        }
    }

    private fun JsonObject.str(key: String) = this[key]?.jsonPrimitive?.contentOrNull
}
