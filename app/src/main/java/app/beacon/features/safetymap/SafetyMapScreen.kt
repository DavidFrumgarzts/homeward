package app.beacon.features.safetymap

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.beacon.app.AppServices
import app.beacon.design.BeaconColors
import app.beacon.design.BeaconType
import app.beacon.design.components.RedButton
import app.beacon.design.components.StatusDot
import app.beacon.design.components.WhiteCard
import app.beacon.device.GeoPoint
import app.beacon.features.safeplace.SafePlacePicker
import java.util.Calendar

// Full-screen safety map. If a red zone is close ahead (and risky at this hour), a bottom sheet
// explains why and offers the nearest open safe place. Everything here works offline.
@Composable
fun SafetyMapScreen(onBack: () -> Unit) {
    val pack = remember { AppServices.packStore.load() }
    val here = remember { AppServices.location.lastKnown() ?: GeoPoint(pack.zones.first().polygon[0][0], pack.zones.first().polygon[0][1]) }
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val redZone = remember { ZoneChecker.redZoneAhead(here, pack.zones, hour) }
    var warning by remember { mutableStateOf<String?>(null) }
    var showSafePlace by remember { mutableStateOf(false) }
    val pick = remember { SafePlacePicker.pick(here, pack.safePlaces, hour) }
    LaunchedEffect(redZone) { redZone?.let { warning = ZoneWarningWriter.write(it) } }

    Box(Modifier.fillMaxSize()) {
        SafetyMapView(here, pack.zones, Modifier.fillMaxSize(), you = here, highlight = if (showSafePlace) pick?.place else null)

        // Top: back button, title, legend
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                IconButton(onBack, Modifier.background(BeaconColors.Surface, CircleShape)) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back")
                }
                WhiteCard(padding = 10) {
                    Text("Safety map · ${pack.city}", style = BeaconType.Label)
                    Text("Saved offline · updated when you landed", style = BeaconType.Small)
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("Safer" to BeaconColors.Green, "Careful" to BeaconColors.Yellow, "Avoid at night" to BeaconColors.Red).forEach { (t, c) ->
                    Box(Modifier.background(BeaconColors.Surface, RoundedCornerShape(50)).padding(horizontal = 10.dp, vertical = 6.dp)) { StatusDot(t, c) }
                }
            }
        }

        // Bottom sheet: only when a red zone is ahead
        if (redZone != null) {
            Column(
                Modifier.align(Alignment.BottomCenter).fillMaxWidth()
                    .background(BeaconColors.Surface, RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    Modifier.background(BeaconColors.RedTint, RoundedCornerShape(50)).padding(horizontal = 10.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(Icons.Outlined.WarningAmber, null, tint = BeaconColors.Red, modifier = Modifier.size(14.dp))
                    Text("You're walking toward a red zone", color = BeaconColors.Red, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
                Text(warning ?: redZone.name, style = BeaconType.Heading)
                redZone.reasons.forEach { Text("•  $it", style = BeaconType.Small) }
                if (showSafePlace && pick != null) Text(pick.reason, style = BeaconType.Body)
                RedButton(if (showSafePlace) "Showing safe place on map" else "Show nearest safe place") { showSafePlace = true }
            }
        }
    }
}
