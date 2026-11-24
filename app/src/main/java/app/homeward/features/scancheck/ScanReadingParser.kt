package app.homeward.features.scancheck

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import java.util.Locale

// PURE LOGIC: turns the on-device model's answer (often JSON wrapped in prose or ``` fences) into a ScanReading.
// Never throws. Accepts "4,20" and lower-case currencies. Null when there is no JSON at all.
// The traveler confirms these numbers before anything is judged. Tested in ScanReadingParserTest.
object ScanReadingParser {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    fun parse(modelText: String): ScanReading? {
        val start = modelText.indexOf('{')
        val end = modelText.lastIndexOf('}')
        if (start < 0 || end <= start) return null
        val obj = runCatching { json.parseToJsonElement(modelText.substring(start, end + 1)).jsonObject }.getOrNull() ?: return null
        return ScanReading(
            kind = ScamKind.entries.firstOrNull { it.name.equals(obj.str("kind"), true) } ?: ScamKind.Other,
            text = obj.str("text").orEmpty().take(300),
            rates = obj.list("rates").mapNotNull { r ->
                val from = r.str("from")?.uppercase(Locale.ROOT)?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
                val to = r.str("to")?.uppercase(Locale.ROOT)?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
                BoardRate(from, to, r.num("buy"), r.num("sell"))
            },
            prices = obj.list("prices").mapNotNull { p ->
                val amount = p.num("amount") ?: return@mapNotNull null
                SeenPrice(p.str("item").orEmpty(), p.str("currency").orEmpty().uppercase(Locale.ROOT), amount)
            },
        )
    }

    private fun JsonObject.str(key: String) = (this[key] as? JsonPrimitive)?.content
    private fun JsonObject.num(key: String) = str(key)?.replace(',', '.')?.trim()?.toDoubleOrNull()
    private fun JsonObject.list(key: String) = (this[key] as? JsonArray).orEmpty().mapNotNull { it as? JsonObject }
}
