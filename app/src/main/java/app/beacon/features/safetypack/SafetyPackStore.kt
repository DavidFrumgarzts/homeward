package app.beacon.features.safetypack

import android.content.Context
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

// Saves and loads the safety pack as a JSON file on the phone. This is what makes it work offline.
class SafetyPackStore(context: Context) {
    private val file = File(context.filesDir, "safety_pack.json")
    private val json = Json { ignoreUnknownKeys = true; prettyPrint = true }

    fun save(pack: SafetyPack) = file.writeText(json.encodeToString(pack))

    // Falls back to the bundled Rio demo pack so the demo works even before the first cloud build.
    fun load(): SafetyPack =
        runCatching { json.decodeFromString<SafetyPack>(file.readText()) }.getOrElse { DemoRioPack.pack }

    fun hasRealPack(): Boolean = file.exists()
}
