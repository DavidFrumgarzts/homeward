package app.homeward.features.safetymap

import android.graphics.Color as AColor
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import app.homeward.device.GeoPoint
import app.homeward.features.safetypack.SafePlace
import app.homeward.features.safetypack.SafetyZone
import app.homeward.features.safetypack.ZoneLevel
import app.homeward.features.offlinemap.MapStyle
import org.osmdroid.views.CustomZoomButtonsController
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polygon
import org.osmdroid.util.GeoPoint as OsmPoint

// A real map (Google Maps-like style, see offlinemap/MapStyle.kt; works offline once saved) with the pack's zones drawn on it (green / yellow / red),
// your position, and optionally a highlighted safe place. Used full-screen and as the Home preview.
@Composable
fun SafetyMapView(
    center: GeoPoint,
    zones: List<SafetyZone>,
    modifier: Modifier = Modifier,
    you: GeoPoint? = null,
    highlight: SafePlace? = null,
    interactive: Boolean = true,
    // Pixels hidden by the bottom sheet. The map shifts up by half of it so "you" stay in view.
    bottomCoveredPx: Int = 0,
) {
    AndroidView(modifier = modifier, factory = { ctx ->
        MapView(ctx).apply {
            setTileSource(MapStyle.tiles)
            zoomController.setVisibility(CustomZoomButtonsController.Visibility.NEVER) // clean look, pinch to zoom
        }
    }) { map ->
        map.setMultiTouchControls(interactive)
        map.isClickable = interactive
        map.controller.setZoom(16.5)
        map.setMapCenterOffset(0, -bottomCoveredPx / 2)
        map.controller.setCenter(OsmPoint(center.lat, center.lng))
        map.overlays.clear() // map credit is drawn by HomeScreen, above the bottom sheet
        zones.forEach { map.overlays.add(zoneShape(it)) }
        zones.filter { it.level != ZoneLevel.Safer }.forEach { map.overlays.add(zoneLabel(map, it)) }
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

// Citizen-style label pinned at the zone's center, e.g. "R. dos Inválidos · after 11pm".
private fun zoneLabel(map: MapView, zone: SafetyZone) = Marker(map).apply {
    val lat = zone.polygon.map { it[0] }.average()
    val lng = zone.polygon.map { it[1] }.average()
    position = OsmPoint(lat, lng)
    val dot = if (zone.level == ZoneLevel.Avoid) AColor.rgb(217, 43, 51) else AColor.rgb(224, 161, 15)
    val hours = if (zone.riskyFromHour == 0 && zone.riskyToHour == 24) "" else " · after ${app.homeward.features.home.NearbyFeed.clock(zone.riskyFromHour)}"
    icon = ZoneLabel.make(map.context.resources, zone.name.replace("Rua ", "R. ") + hours, dot)
    setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
    setInfoWindow(null) // label only, no popup
}
