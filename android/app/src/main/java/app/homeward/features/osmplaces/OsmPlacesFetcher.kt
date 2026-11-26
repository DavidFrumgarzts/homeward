package app.homeward.features.osmplaces

import android.util.Log
import app.homeward.features.offlinemap.OfflineArea
import app.homeward.features.safetypack.SafePlace
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

// Downloads REAL safe places (police, hospitals, pharmacies, gas stations) from OpenStreetMap
// for the city box, while online. Verified map data instead of AI guesses. Free (ODbL, credited).
// The public servers are slow and sometimes busy, so: long timeout, then a backup server.
object OsmPlacesFetcher {
    private const val TAG = "OsmPlacesFetcher"
    private val SERVERS = listOf("https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter")

    // Blocking network call: run on Dispatchers.IO. Returns empty list if every server fails.
    fun fetch(box: OfflineArea.Box): List<SafePlace> {
        val body = "data=" + URLEncoder.encode(OverpassQuery.safePlaces(box), "UTF-8")
        for (server in SERVERS) {
            val result = runCatching { post(server, body) }
            result.onFailure { Log.w(TAG, "$server failed: ${it.message}") }
            result.getOrNull()?.let { return OverpassParser.parse(it) }
        }
        return emptyList()
    }

    private fun post(server: String, body: String): String {
        val conn = URL(server).openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.connectTimeout = 15_000
        conn.readTimeout = 60_000
        conn.doOutput = true
        conn.setRequestProperty("User-Agent", "Homeward-safety-app (hackathon)") // required by their usage policy
        conn.outputStream.use { it.write(body.toByteArray()) }
        check(conn.responseCode == 200) { "HTTP ${conn.responseCode}" }
        return conn.inputStream.bufferedReader().use { it.readText() }
    }
}
