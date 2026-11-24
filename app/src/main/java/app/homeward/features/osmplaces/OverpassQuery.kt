package app.homeward.features.osmplaces

import app.homeward.features.offlinemap.OfflineArea

// PURE LOGIC: the OpenStreetMap (Overpass) question we ask: "every police station, hospital,
// pharmacy and gas station inside this box". `out center` gives one point even for buildings.
object OverpassQuery {
    val KINDS = listOf("police", "hospital", "pharmacy", "fuel")

    fun safePlaces(box: OfflineArea.Box, limit: Int = 200): String =
        "[out:json][timeout:40];" +
            "nwr[\"amenity\"~\"^(${KINDS.joinToString("|")})$\"](${box.south},${box.west},${box.north},${box.east});" +
            "out center $limit;"
}
