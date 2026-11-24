package app.homeward.features.offlinemap

import app.homeward.BuildConfig
import org.osmdroid.tileprovider.tilesource.OnlineTileSourceBase
import org.osmdroid.tileprovider.tilesource.TileSourceFactory

// Which map tiles the app uses, in one place.
//
// With a CARTO key in local.properties (CARTO_KEY=...): CARTO Voyager, the Google Maps-like look.
//   CARTO's terms: free for non-commercial use up to 5M tiles/month, credit always visible,
//   no bulk downloading, and tiles cached on the phone for at most 30 days.
// Without a key: standard OpenStreetMap tiles (no pre-saving allowed by OSM's tile policy).
object MapStyle {
    const val CARTO_CREDIT = "© OpenStreetMap contributors, © CARTO"
    private const val OSM_CREDIT = "© OpenStreetMap contributors"

    private val key: String = BuildConfig.CARTO_KEY
    val usingCarto: Boolean = key.isNotBlank()

    val tiles: OnlineTileSourceBase = if (usingCarto) CartoTiles(key) else TileSourceFactory.MAPNIK
    val credit: String = if (usingCarto) CARTO_CREDIT else OSM_CREDIT

    // CARTO allows device caching but not bulk downloads, so we pre-save only a small
    // neighborhood around the risky zones (see OfflineArea.MAX_SPAN_DEG) and delete it after 30 days.
    val allowsBulkDownload: Boolean = usingCarto
    const val MAX_CACHE_DAYS = 30L
}
