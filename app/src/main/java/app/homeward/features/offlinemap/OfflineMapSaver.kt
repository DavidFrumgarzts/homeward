package app.homeward.features.offlinemap

import android.content.Context
import android.util.Log
import app.homeward.features.safetypack.SafetyPack
import org.osmdroid.tileprovider.cachemanager.CacheManager
import org.osmdroid.tileprovider.modules.SqlTileWriter
import org.osmdroid.util.BoundingBox

// Saves the map of the city to the phone (while on wifi, right after the safety pack is built),
// so the map still shows streets on a dark street with no signal.
// Zoom 13-17 covers "whole neighborhood" down to "street names readable".
object OfflineMapSaver {
    private const val TAG = "OfflineMapSaver"
    private const val MIN_ZOOM = 13
    private const val MAX_ZOOM = 17

    // Saves each city only once (remembered on the phone), so reopening the app doesn't re-download.
    fun saveCityOnce(context: Context, pack: SafetyPack) {
        val prefs = context.getSharedPreferences("offline_map", Context.MODE_PRIVATE)
        if (prefs.getBoolean(pack.city, false)) return
        saveCity(context, pack)
        prefs.edit().putBoolean(pack.city, true).apply()
    }

    fun saveCity(context: Context, pack: SafetyPack) {
        if (!MapStyle.allowsBulkDownload) return // current map provider forbids it (see MapStyle.kt)
        val area = OfflineArea.around(pack) ?: return
        val box = BoundingBox(area.north, area.east, area.south, area.west)
        val manager = CacheManager(MapStyle.tiles, SqlTileWriter(), MIN_ZOOM, MAX_ZOOM)
        manager.downloadAreaAsyncNoUI(context, box, MIN_ZOOM, MAX_ZOOM, object : CacheManager.CacheManagerCallback {
            override fun onTaskComplete() { Log.i(TAG, "Offline map saved for ${pack.city}") }
            override fun onTaskFailed(errors: Int) { Log.w(TAG, "Offline map saved with $errors missing tiles") }
            override fun updateProgress(progress: Int, currentZoomLevel: Int, zoomMin: Int, zoomMax: Int) = Unit
            override fun downloadStarted() = Unit
            override fun setPossibleTilesInArea(total: Int) { Log.i(TAG, "Saving $total map tiles") }
        })
    }
}
