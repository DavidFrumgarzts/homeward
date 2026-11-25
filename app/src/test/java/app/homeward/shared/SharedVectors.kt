package app.homeward.shared

import kotlinx.serialization.json.*
import org.junit.Assert.assertTrue
import java.io.File

// Runs the cases in shared/test-vectors/ through the Kotlin logic. iOS and web run the same files,
// so the three ports give the same answers.
// Android's logic is the reference: after changing it on purpose, run the tests once with
// BEACON_WRITE_FIXTURES=1 to write the new expected values, then read the diff before committing.
object SharedVectors {
    val json = Json { ignoreUnknownKeys = true; encodeDefaults = true; prettyPrint = true; prettyPrintIndent = "  " }
    private val dir = File("../shared/test-vectors") // unit tests run from the app/ folder
    private val writing = System.getenv("BEACON_WRITE_FIXTURES") == "1"

    fun run(fileName: String, compute: (fn: String, input: JsonObject) -> JsonElement) {
        val file = File(dir, fileName)
        val root = json.parseToJsonElement(file.readText()).jsonObject
        val cases = root.getValue("cases").jsonArray.map { it.jsonObject }
        val actual = cases.map { compute(it.getValue("fn").jsonPrimitive.content, it.getValue("input").jsonObject) }
        if (writing) {
            val filled = cases.zip(actual).map { (case, result) -> JsonObject(case - "expected" + ("expected" to result)) }
            file.writeText(json.encodeToString(JsonElement.serializer(), JsonObject(root + ("cases" to JsonArray(filled)))) + "\n")
            return
        }
        cases.zip(actual).forEach { (case, result) ->
            val tolerance = case["tolerance"]?.jsonPrimitive?.doubleOrNull ?: 0.0
            val expected = case.getValue("expected")
            assertTrue("$fileName / ${case["name"]}:\n expected $expected\n but got  $result", same(expected, result, tolerance))
        }
    }

    // Equal JSON, where numbers may differ by `tolerance` (metres from different math libraries) and 3 == 3.0.
    private fun same(a: JsonElement, b: JsonElement, tolerance: Double): Boolean = when {
        a is JsonNull || b is JsonNull -> a is JsonNull && b is JsonNull
        a is JsonObject && b is JsonObject -> a.keys == b.keys && a.keys.all { same(a.getValue(it), b.getValue(it), tolerance) }
        a is JsonArray && b is JsonArray -> a.size == b.size && a.indices.all { same(a[it], b[it], tolerance) }
        a is JsonPrimitive && b is JsonPrimitive -> {
            val x = a.doubleOrNull; val y = b.doubleOrNull
            if (!a.isString && !b.isString && x != null && y != null) kotlin.math.abs(x - y) <= tolerance + 1e-9
            else a.isString == b.isString && a.content == b.content
        }
        else -> false
    }

    inline fun <reified T> JsonObject.read(key: String): T = json.decodeFromJsonElement(getValue(key))
    inline fun <reified T> JsonObject.readOrNull(key: String): T? = this[key]?.takeIf { it !is JsonNull }?.let { json.decodeFromJsonElement<T>(it) }
    inline fun <reified T> write(value: T): JsonElement = json.encodeToJsonElement(value)
}
