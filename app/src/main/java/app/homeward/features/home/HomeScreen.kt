package app.homeward.features.home

import androidx.compose.foundation.layout.*
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import app.homeward.app.AppServices
import app.homeward.device.GeoPoint
import app.homeward.features.checkin.CheckInSender
import app.homeward.features.lapamap.LapaIllustratedMap
import app.homeward.features.lapamap.LapaMapProjection
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
// This file only wires the pieces together.
@Composable
fun HomeScreen(onSos: () -> Unit, onEditContacts: () -> Unit, onAsk: (String) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val pack = remember { AppServices.packStore.load() }
    val contactNames = remember { AppServices.contacts.all().joinToString(", ") { it.name } }
    // Your position: starts at the last known fix, then follows GPS live while Home is open.
    var here by remember { mutableStateOf(AppServices.location.lastKnown() ?: GeoPoint(pack.zones.first().polygon[0][0], pack.zones.first().polygon[0][1])) }
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val redZone = remember(here) { ZoneChecker.redZoneAhead(here, pack.zones, hour) }
    val safePlace = remember(here) { SafePlacePicker.pick(here, pack.safePlaces, hour) }

    // Walking toward a red zone? Buzz once (ApproachDetector decides when) and the banner shows.
    val detector = remember { ApproachDetector() }
    LaunchedEffect(Unit) {
        AppServices.locationUpdates.stream().collect { point ->
            here = point
            val nowHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
            if (detector.update(point, pack.zones, nowHour, System.currentTimeMillis()) != null) AppServices.haptics.warn()
        }
    }
    var showSafePlace by remember { mutableStateOf(false) }
    var popup by remember { mutableStateOf<String?>(null) }
    var sheetHeightPx by remember { mutableStateOf(0) } // measured, so the real map can keep you above the sheet

    Box(Modifier.fillMaxSize()) {
        if (LapaMapProjection.contains(here)) {
            // "RED ZONE / AFTER 11PM": the hour comes from the saved pack.
            val avoid = pack.zones.firstOrNull { it.level == ZoneLevel.Avoid }
            LapaIllustratedMap(LapaMapProjection.toSpot(here), "RED ZONE" + (avoid?.let { "\nAFTER ${NearbyFeed.clock(it.riskyFromHour).uppercase()}" } ?: ""), Modifier.fillMaxSize())
        } else {
            SafetyMapView(here, pack.zones, Modifier.fillMaxSize(), you = here, highlight = if (showSafePlace) safePlace?.place else null, bottomCoveredPx = sheetHeightPx)
        }

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
            police = pack.police, contactNames = contactNames, safePlace = safePlace,
            onAsk = onAsk,
            onSafePlace = { showSafePlace = true; popup = safePlace?.reason ?: "No open safe place saved nearby." },
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
