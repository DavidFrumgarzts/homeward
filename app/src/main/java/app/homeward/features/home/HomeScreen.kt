package app.homeward.features.home

import androidx.compose.foundation.layout.*
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import app.homeward.app.AppServices
import app.homeward.design.HomewardType
import app.homeward.design.components.rememberBlinkOn
import app.homeward.features.scancheck.RecommendedPlace
import app.homeward.device.GeoPoint
import app.homeward.features.checkin.CheckInSender
import app.homeward.features.lapamap.Heading
import app.homeward.features.lapamap.LapaBadges
import app.homeward.features.lapamap.LapaIllustratedMap
import app.homeward.features.lapamap.LapaMapProjection
import app.homeward.features.offlinemap.MapStyle
import app.homeward.features.policecall.PoliceCaller
import app.homeward.features.safeplace.SafePlacePicker
import app.homeward.features.safetymap.ApproachDetector
import app.homeward.features.safetymap.SafetyMapView
import app.homeward.features.safetymap.ZoneChecker
import app.homeward.features.safetymap.ZoneWarningWriter
import app.homeward.features.safetypack.ZoneLevel
import kotlinx.coroutines.launch
import java.util.Calendar

// Home is the map: it follows you live, shows a red-zone alert on top (plus a buzz) when you walk
// toward one, and has a bottom sheet with Ask Beacon, the nearest safe place and SOS.
// Inside Lapa the map is the illustrated one (lapamap/); anywhere else it is the real street map (safetymap/).
// `highlightName` is a place Beacon recommended (Ask Beacon or a scan): it blinks yellow on the map until you tap the map.
// This file only wires the pieces together.
@Composable
fun HomeScreen(onSos: () -> Unit, onEditContacts: () -> Unit, onAsk: (String) -> Unit, onScan: () -> Unit, highlightName: String = "") {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val pack = remember { AppServices.packStore.load() }
    val contactNames = remember { AppServices.contacts.all().joinToString(", ") { it.name } }
    // Your position: starts at the last known fix, then follows GPS live while Home is open.
    var here by remember { mutableStateOf(AppServices.location.lastKnown() ?: GeoPoint(pack.zones.first().polygon[0][0], pack.zones.first().polygon[0][1])) }
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val redZone = remember(here) { ZoneChecker.redZoneAhead(here, pack.zones, hour) }
    val safePlace = remember(here) { SafePlacePicker.pick(here, pack.safePlaces, hour) }

    // The recommended place: a yellow ring that blinks for 8 seconds, then stays until you tap the map.
    val recommended = remember(highlightName) { RecommendedPlace.byName(highlightName, pack) }
    var showRecommended by remember(recommended) { mutableStateOf(recommended != null) }
    val shown = recommended?.takeIf { showRecommended }
    // On the drawn map: its badge if it has one (police, hospital), else its GPS spot on the drawing.
    val shownSpot = shown?.let { LapaBadges.spotFor(it) ?: LapaMapProjection.toSpot(GeoPoint(it.lat, it.lng)) }
    val ringOn = rememberBlinkOn(shown)
    val sheetPlace = shown?.let {
        val m = here.metersTo(GeoPoint(it.lat, it.lng)).toInt()
        SafePlacePicker.Pick(it, m, "${it.name}, $m m. Beacon recommended it.")
    } ?: safePlace

    // Walking toward a red zone? Buzz once (ApproachDetector decides when) and the banner shows.
    val detector = remember { ApproachDetector() }
    var heading by remember { mutableStateOf<Float?>(null) } // which way you're walking; null until you move
    LaunchedEffect(Unit) {
        AppServices.locationUpdates.stream().collect { point ->
            Heading.between(here, point)?.let { heading = it }
            here = point
            val nowHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
            if (detector.update(point, pack.zones, nowHour, System.currentTimeMillis()) != null) AppServices.haptics.warn()
        }
    }
    var showSafePlace by remember { mutableStateOf(false) }
    var popup by remember { mutableStateOf<String?>(null) }
    var sheetHeightPx by remember { mutableStateOf(0) } // measured, so the real map can keep you above the sheet

    Box(Modifier.fillMaxSize()) {
        val dismiss = Modifier.pointerInput(shown) { detectTapGestures { showRecommended = false } }
        // Drawn Lapa map when you're in Lapa, unless the recommended place is outside the drawing.
        if (LapaMapProjection.contains(here) && (shown == null || shownSpot != null)) {
            // "RED ZONE / AFTER 11PM": the hour comes from the saved pack.
            val avoid = pack.zones.firstOrNull { it.level == ZoneLevel.Avoid }
            LapaIllustratedMap(LapaMapProjection.toSpot(here), heading, "RED ZONE" + (avoid?.let { "\nAFTER ${NearbyFeed.clock(it.riskyFromHour).uppercase()}" } ?: ""),
                Modifier.fillMaxSize().then(dismiss), highlight = shownSpot)
        } else {
            val center = shown?.let { GeoPoint((here.lat + it.lat) / 2, (here.lng + it.lng) / 2) } ?: here
            SafetyMapView(center, pack.zones, Modifier.fillMaxSize(), you = here, highlight = shown ?: if (showSafePlace) safePlace?.place else null,
                bottomCoveredPx = sheetHeightPx, highlightRing = shown != null && ringOn)
        }

        // Map credit, required by the OpenStreetMap license (map tiles and safe places). Sits just above the sheet.
        Text(
            MapStyle.credit, style = HomewardType.PlaceLabel,
            modifier = Modifier.align(Alignment.BottomEnd)
                .padding(bottom = with(LocalDensity.current) { sheetHeightPx.toDp() } + 6.dp, end = 12.dp),
        )

        redZone?.let { zone ->
            RedZoneBanner(zone, ZoneChecker.distanceToZone(here, zone).toInt(), modifier = Modifier.statusBarsPadding().padding(16.dp), onClick = {
                scope.launch {
                    showSafePlace = true
                    popup = ZoneWarningWriter.write(zone) + "\n\n" + zone.reasons.joinToString("\n") { "• $it" } +
                        (safePlace?.let { "\n\nGo to: ${it.reason}" } ?: "")
                }
            })
        }

        HomeBottomSheet(
            police = pack.police, contactNames = contactNames, safePlace = sheetPlace,
            onAsk = onAsk,
            onScan = onScan,
            onSafePlace = { showSafePlace = true; popup = sheetPlace?.reason ?: "No open safe place saved nearby." },
            onImOk = {
                scope.launch {
                    val reached = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) { CheckInSender.send() }
                    popup = if (reached.isEmpty()) "Add someone first (Edit)." else "Sent \"I'm OK\" to ${reached.joinToString(", ")}."
                }
            },
            onPolice = { PoliceCaller.dial(context, pack.police) },
            onSos = onSos,
            onEditContacts = onEditContacts,
            modifier = Modifier.align(Alignment.BottomCenter).onSizeChanged { sheetHeightPx = it.height },
        )
    }

    popup?.let { AlertDialog(onDismissRequest = { popup = null }, confirmButton = { TextButton({ popup = null }) { Text("OK") } }, text = { Text(it) }) }
}
