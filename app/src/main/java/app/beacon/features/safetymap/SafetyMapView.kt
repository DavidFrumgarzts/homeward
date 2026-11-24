package app.beacon.features.safetymap

import android.graphics.Color as AColor
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import app.beacon.device.GeoPoint
import app.beacon.features.safetypack.SafePlace
import app.beacon.features.safetypack.SafetyZone
import app.beacon.features.safetypack.ZoneLevel
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polygon
import org.osmdroid.util.GeoPoint as OsmPoint

// A real OpenStreetMap map with the pack's zones drawn on it (green / yellow / red),
// your position, and optionally a highlighted safe place. Used full-screen and as the Home preview.
@Composable
fun SafetyMapView(
    center: GeoPoint,
    zones: List<SafetyZone>,
    modifier: Modifier = Modifier,
    you: GeoPoint? = null,
    highlight: SafePlace? = null,
    interactive: Boolean = true,
) {
    AndroidView(modifier = modifier, factory = { ctx -> MapView(ctx).apply { setTileSource(TileSourceFactory.MAPNIK) } }) { map ->
        map.setMultiTouchControls(interactive)
        map.isClickable = interactive
        map.controller.setZoom(16.5)
        map.controller.setCenter(OsmPoint(center.lat, center.lng))
        map.overlays.clear()
        zones.forEach { map.overlays.add(zoneShape(it)) }
        you?.let { map.overlays.add(pin(map, it, "You")) }
        highlight?.let { map.overlays.add(pin(map, GeoPoint(it.lat, it.lng), it.name)) }
        map.invalidate()
    }
}

// Zone polygon colored by level: soft fill + solid outline.
private fun zoneShape(zone: SafetyZone) = Polygon().apply {
    points = zone.polygon.map { OsmPoint(it[0], it[1]) }
    val rgb = when (zone.level) {
        ZoneLevel.Safer -> AColor.rgb(30, 158, 98)
        ZoneLevel.Careful -> AColor.rgb(224, 161, 15)
        ZoneLevel.Avoid -> AColor.rgb(217, 43, 51)
    }
    fillPaint.color = AColor.argb(45, AColor.red(rgb), AColor.green(rgb), AColor.blue(rgb))
    outlinePaint.color = rgb
    outlinePaint.strokeWidth = 4f
    title = zone.name
}

private fun pin(map: MapView, p: GeoPoint, label: String) = Marker(map).apply {
    position = OsmPoint(p.lat, p.lng)
    title = label
    setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
}
