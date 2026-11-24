package app.homeward.features.home

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import app.homeward.app.AppServices
import app.homeward.device.GeoPoint
import app.homeward.features.policecall.PoliceCaller
import app.homeward.features.safeplace.SafePlacePicker
import app.homeward.features.safetymap.ApproachDetector
import app.homeward.features.safetymap.SafetyMapView
import app.homeward.features.safetymap.ZoneChecker
import app.homeward.features.safetymap.ZoneWarningWriter
import app.homeward.features.safetyphoto.PhotoOutbox
import app.homeward.features.safetyphoto.SafetyPhotoReader
import kotlinx.coroutines.launch
import java.util.Calendar

// Home is the map (like Find My / Waze): full-screen safety map that follows you live, a red-zone
// alert on top (plus a buzz) when you walk toward one, and a bottom sheet with SOS + three actions. This file only wires them up.
@Composable
fun HomeScreen(onSos: () -> Unit, onEditContacts: () -> Unit) {
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

    // Photo: take picture -> on-device AI reads it -> queued for family until online.
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap ->
        if (bitmap != null) scope.launch {
            val line = SafetyPhotoReader.read(bitmap)
            AppServices.photoOutbox.add(PhotoOutbox.Entry(line, here.lat, here.lng, System.currentTimeMillis()))
            popup = "Saved: $line\nSent to $contactNames when you have connection."
        }
    }

    Box(Modifier.fillMaxSize()) {
        SafetyMapView(here, pack.zones, Modifier.fillMaxSize(), you = here, highlight = if (showSafePlace) safePlace?.place else null)

        redZone?.let { zone ->
            RedZoneBanner(zone, ZoneChecker.distanceToZone(here, zone).toInt(), modifier = Modifier.padding(16.dp), onClick = {
                scope.launch {
                    showSafePlace = true
                    popup = ZoneWarningWriter.write(zone) + "\n\n" + zone.reasons.joinToString("\n") { "• $it" } +
                        (safePlace?.let { "\n\nGo to: ${it.reason}" } ?: "")
                }
            })
        }

        HomeBottomSheet(
            city = pack.city, country = pack.country, police = pack.police, contactNames = contactNames, onEditContacts = onEditContacts,
            onSos = onSos,
            onPhoto = { camera.launch(null) },
            onSafePlace = { showSafePlace = true; popup = safePlace?.reason ?: "No open safe place saved nearby." },
            onPolice = { PoliceCaller.dial(context, pack.police) },
            modifier = Modifier.align(Alignment.BottomCenter),
        )
    }

    popup?.let { AlertDialog(onDismissRequest = { popup = null }, confirmButton = { TextButton({ popup = null }) { Text("OK") } }, text = { Text(it) }) }
}
