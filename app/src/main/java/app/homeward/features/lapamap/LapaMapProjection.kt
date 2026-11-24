package app.homeward.features.lapamap

import app.homeward.device.GeoPoint

// PURE LOGIC: places a GPS point on the illustrated Lapa map. Tested in LapaMapProjectionTest.
// The drawing uses its own grid, 393 wide and 520 tall (the same numbers as the Figma frame).
// The map is stylized, so this is a simple straight-line fit, good enough to show roughly where you are.
object LapaMapProjection {
    const val WIDTH = 393f
    const val HEIGHT = 520f

    // The real-world box the drawing covers (about 920 m wide, 1.2 km tall).
    private const val WEST = -43.1860
    private const val EAST = -43.1770
    private const val NORTH = -22.90628
    private const val SOUTH = -22.91722

    data class Spot(val x: Float, val y: Float)

    fun contains(point: GeoPoint): Boolean =
        point.lng in WEST..EAST && point.lat in SOUTH..NORTH

    // Null when the point is outside the drawing.
    fun toSpot(point: GeoPoint): Spot? {
        if (!contains(point)) return null
        val x = (point.lng - WEST) / (EAST - WEST) * WIDTH
        val y = (NORTH - point.lat) / (NORTH - SOUTH) * HEIGHT
        return Spot(x.toFloat(), y.toFloat())
    }
}
