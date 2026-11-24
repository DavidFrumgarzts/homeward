package app.homeward.features.osmplaces

import app.homeward.device.GeoPoint
import app.homeward.features.offlinemap.OfflineArea
import app.homeward.features.safetypack.SafetyPack

// Swaps the pack's AI-researched safe places for REAL ones from OpenStreetMap (when we get any).
// Keeps the closest `max` to the middle of the area so the saved pack stays small.
object PlacesEnricher {
    fun withOsmPlaces(pack: SafetyPack, fetch: (OfflineArea.Box) -> List<app.homeward.features.safetypack.SafePlace> = OsmPlacesFetcher::fetch, max: Int = 80): SafetyPack {
        val box = OfflineArea.around(pack) ?: return pack
        val osm = fetch(box)
        if (osm.isEmpty()) return pack // offline or server busy: keep what we had
        val center = GeoPoint((box.north + box.south) / 2, (box.east + box.west) / 2)
        val nearest = osm.sortedBy { center.metersTo(GeoPoint(it.lat, it.lng)) }.take(max)
        return pack.copy(safePlaces = nearest, placesFromOsm = true)
    }
}
