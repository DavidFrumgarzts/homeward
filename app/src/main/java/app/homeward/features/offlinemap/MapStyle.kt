package app.homeward.features.offlinemap

import org.osmdroid.tileprovider.tilesource.OnlineTileSourceBase
import org.osmdroid.tileprovider.tilesource.XYTileSource

// How the map looks. CARTO "Voyager" tiles: light, clean, every street name, close to Google Maps.
// Built on OpenStreetMap data. Free for non-commercial use up to 75k map views a month, with credit
// shown on the map (see CREDIT). Swap the URL here to change the look everywhere.
object MapStyle {
    const val CREDIT = "© OpenStreetMap contributors © CARTO"

    val tiles: OnlineTileSourceBase = XYTileSource(
        "CartoVoyager", 1, 19, 256, ".png",
        arrayOf(
            "https://a.basemaps.cartocdn.com/rastertiles/voyager/",
            "https://b.basemaps.cartocdn.com/rastertiles/voyager/",
            "https://c.basemaps.cartocdn.com/rastertiles/voyager/",
        ),
        CREDIT,
    )
}
