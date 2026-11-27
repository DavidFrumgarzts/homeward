package app.homeward.features.offlinemap

import app.homeward.features.safetypack.SafetyPack

// PURE LOGIC: which rectangle of the city to save for offline use.
// The box around every zone and safe place in the pack, plus a margin, capped at ~2 km so we
// only pre-save the neighborhood that matters, never bulk-download a city. Tested in OfflineAreaTest.
object OfflineArea {
    data class Box(val north: Double, val east: Double, val south: Double, val west: Double)

    private const val MARGIN_DEG = 0.005   // about 500 m around the outermost point
    private const val MAX_SPAN_DEG = 0.02  // about 2 km across at most: a neighborhood, not a city (no bulk downloads)

    fun around(pack: SafetyPack): Box? {
        val lats = pack.zones.flatMap { z -> z.polygon.map { it[0] } } + pack.safePlaces.map { it.lat }
        val lngs = pack.zones.flatMap { z -> z.polygon.map { it[1] } } + pack.safePlaces.map { it.lng }
        if (lats.isEmpty()) return null
        val box = Box(lats.max() + MARGIN_DEG, lngs.max() + MARGIN_DEG, lats.min() - MARGIN_DEG, lngs.min() - MARGIN_DEG)
        return capSize(box)
    }

    // Shrinks an oversized box around its center.
    internal fun capSize(b: Box): Box {
        val cLat = (b.north + b.south) / 2
        val cLng = (b.east + b.west) / 2
        val halfLat = minOf((b.north - b.south) / 2, MAX_SPAN_DEG / 2)
        val halfLng = minOf((b.east - b.west) / 2, MAX_SPAN_DEG / 2)
        return Box(cLat + halfLat, cLng + halfLng, cLat - halfLat, cLng - halfLng)
    }
}
