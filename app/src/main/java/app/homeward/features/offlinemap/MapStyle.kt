package app.homeward.features.offlinemap

import org.osmdroid.tileprovider.tilesource.OnlineTileSourceBase
import org.osmdroid.tileprovider.tilesource.TileSourceFactory

// How the map looks, in one place. Change the source here and it changes everywhere.
//
// Now: the standard OpenStreetMap map (free, no key, every street name).
// OpenStreetMap's tile rules forbid bulk downloading, so `allowsBulkDownload` is false:
// the app keeps the streets you've already viewed, but does not pre-save the whole city.
// To get a Google Maps-like look AND full offline cities, add a provider key (CARTO or MapTiler)
// and switch `tiles` + set `allowsBulkDownload = true` if their terms allow it.
// (CARTO's free tiles started requiring an API key, which is why we moved off them.)
object MapStyle {
    const val CREDIT = "© OpenStreetMap contributors"
    val tiles: OnlineTileSourceBase = TileSourceFactory.MAPNIK
    const val allowsBulkDownload = false
}
