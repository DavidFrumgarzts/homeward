package app.homeward.features.scancheck

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonObject

// PURE LOGIC: turns the research answer into ScamWarnings. Never throws; drops broken items and items with no source.
object ScamResearchParser {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true; coerceInputValues = true }

    fun parse(modelText: String): List<ScamWarning> {
        val start = modelText.indexOf('{')
        val end = modelText.lastIndexOf('}')
        if (start < 0 || end <= start) return emptyList()
        val root = runCatching { json.parseToJsonElement(modelText.substring(start, end + 1)).jsonObject }.getOrNull() ?: return emptyList()
        val items = (root["scams"] as? JsonArray).orEmpty().filterIsInstance<JsonObject>()
        return items.mapNotNull { runCatching { json.decodeFromJsonElement<ScamWarning>(it) }.getOrNull() }
            .filter { it.sources.any { s -> s.startsWith("http") } && it.title.isNotBlank() }
    }
}
