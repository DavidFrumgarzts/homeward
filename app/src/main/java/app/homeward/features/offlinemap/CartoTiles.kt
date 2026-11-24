package app.homeward.features.offlinemap

import org.osmdroid.tileprovider.tilesource.OnlineTileSourceBase
import org.osmdroid.util.MapTileIndex

// CARTO "Voyager" map tiles (light, Google Maps-like, every street name) with our API key added
// to each tile URL, as CARTO requires: .../voyager/{z}/{x}/{y}.png?key=KEY
class CartoTiles(private val key: String) : OnlineTileSourceBase(
    "CartoVoyager", 1, 19, 256, ".png",
    arrayOf("https://basemaps.cartocdn.com/rastertiles/voyager/"),
    MapStyle.CARTO_CREDIT,
) {
    override fun getTileURLString(pMapTileIndex: Long): String =
        baseUrl + MapTileIndex.getZoom(pMapTileIndex) + "/" + MapTileIndex.getX(pMapTileIndex) + "/" +
            MapTileIndex.getY(pMapTileIndex) + mImageFilenameEnding + "?key=" + key
}
