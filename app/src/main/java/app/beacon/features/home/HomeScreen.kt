package app.beacon.features.home

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.beacon.app.AppServices
import app.beacon.design.BeaconColors
import app.beacon.design.BeaconType
import app.beacon.design.components.*
import app.beacon.device.GeoPoint
import app.beacon.features.policecall.PoliceCaller
import app.beacon.features.safeplace.SafePlacePicker
import app.beacon.features.safetymap.SafetyMapView
import app.beacon.features.safetymap.ZoneChecker
import app.beacon.features.safetyphoto.PhotoOutbox
import app.beacon.features.safetyphoto.SafetyPhotoReader
import kotlinx.coroutines.launch
import java.util.Calendar

// Home: where you are, map preview with the next red zone, the SOS button,
// quick actions (safety photo, safe place, local police) and who gets your SOS.
@Composable
fun HomeScreen(onSos: () -> Unit, onOpenMap: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val pack = remember { AppServices.packStore.load() }
    val contacts = remember { AppServices.contacts.all() }
    val here = remember { AppServices.location.lastKnown() ?: GeoPoint(pack.zones.first().polygon[0][0], pack.zones.first().polygon[0][1]) }
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val redZone = remember { ZoneChecker.redZoneAhead(here, pack.zones, hour) }
    var popup by remember { mutableStateOf<String?>(null) }

    // Safety photo: take a picture -> on-device AI reads it -> queued to send to family.
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap ->
        if (bitmap != null) scope.launch {
            val line = SafetyPhotoReader.read(bitmap)
            AppServices.photoOutbox.add(PhotoOutbox.Entry(line, here.lat, here.lng, System.currentTimeMillis()))
            popup = "Saved: $line\nIt will be sent to your contacts when you have connection."
        }
    }

    Column(Modifier.fillMaxSize().background(BeaconColors.Background).padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // Location + pack status
        Row(Modifier.shadow(4.dp, RoundedCornerShape(50)).background(BeaconColors.Surface, RoundedCornerShape(50)).padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(Icons.Outlined.Place, null, tint = BeaconColors.Red, modifier = Modifier.size(18.dp))
            Text(pack.city, style = BeaconType.Label)
        }
        StatusDot("${pack.country} pack saved · works offline", BeaconColors.Green)

        // Map preview
        WhiteCard(padding = 0, modifier = Modifier.clickable(onClick = onOpenMap)) {
            SafetyMapView(here, pack.zones, Modifier.fillMaxWidth().height(120.dp).clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)), you = here, interactive = false)
            Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(redZone?.let { "Red zone ahead: ${it.name}" } ?: "No red zones near you", color = if (redZone != null) BeaconColors.Red else BeaconColors.Green, fontWeight = FontWeight.SemiBold)
                    redZone?.reasons?.firstOrNull()?.let { Text(it, style = BeaconType.Small) }
                }
                Text("Open map", color = BeaconColors.Red, fontWeight = FontWeight.SemiBold)
            }
        }

        // SOS
        Row(Modifier.fillMaxWidth().shadow(8.dp, RoundedCornerShape(18.dp)).background(BeaconColors.Red, RoundedCornerShape(18.dp)).clickable(onClick = onSos).padding(18.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Box(Modifier.size(44.dp).background(Color.White.copy(alpha = 0.2f), CircleShape), contentAlignment = Alignment.Center) {
                Icon(Icons.Outlined.ErrorOutline, null, tint = Color.White)
            }
            Column {
                Text("SOS", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Text("Works with no signal", color = Color.White.copy(alpha = 0.85f), fontSize = 13.sp)
            }
        }

        // Quick actions
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            QuickAction("Safety photo", Icons.Outlined.PhotoCamera, Modifier.weight(1f)) { camera.launch(null) }
            QuickAction("Safe place", Icons.Outlined.Place, Modifier.weight(1f)) {
                popup = SafePlacePicker.pick(here, pack.safePlaces, hour)?.reason ?: "No open safe place saved nearby."
            }
            QuickAction("Police ${pack.police}", Icons.Outlined.Phone, Modifier.weight(1f)) { PoliceCaller.dial(context, pack.police) }
        }

        // Who gets the SOS
        WhiteCard(Modifier.fillMaxWidth()) {
            Text("SOS goes to", style = BeaconType.Label)
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(18.dp)) { contacts.forEach { ContactAvatar(it.initial, it.name) } }
        }
        Spacer(Modifier.weight(1f))
        BottomBar(selected = Tab.Home, onSelect = { if (it == Tab.Map) onOpenMap() })
    }

    popup?.let { AlertDialog(onDismissRequest = { popup = null }, confirmButton = { TextButton({ popup = null }) { Text("OK") } }, text = { Text(it) }) }
}

// One quick-action tile: red icon circle + label on a white card.
@Composable
private fun QuickAction(label: String, icon: ImageVector, modifier: Modifier, onClick: () -> Unit) {
    WhiteCard(modifier.clickable(onClick = onClick), padding = 12) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            IconCircle(icon)
            Text(label, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = BeaconColors.Text)
        }
    }
}
