package app.homeward.features.onboarding

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.MenuBook
import androidx.compose.material.icons.outlined.Memory
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import app.homeward.ai.OnDeviceModelSetup
import app.homeward.app.AppServices
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.IconCircle
import app.homeward.design.components.WhiteCard
import app.homeward.features.safetypack.PackUpdater
import app.homeward.features.safetypack.SafetyPack
import app.homeward.features.safetypack.ZoneLevel
import kotlinx.coroutines.launch

// Setup step 4 (Figma "06 Ready offline"): while on wifi, get everything needed offline: red zones and the
// safety pack (cloud AI), real safe places (OpenStreetMap) and the AI model for the phone.
// Shows live status. The button works any time; the rest keeps going in the background.
@Composable
fun GetReadyStep(onDone: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var pack by remember { mutableStateOf<SafetyPack?>(null) } // null until the pack is checked/updated
    var aiLine by remember { mutableStateOf("Checking this phone") }
    var aiDone by remember { mutableStateOf(false) }
    val city = remember { AppServices.packStore.load().city }

    LaunchedEffect(Unit) {
        scope.launch {
            OnDeviceModelSetup.ensureDownloaded { state ->
                aiDone = state != OnDeviceModelSetup.State.Downloading
                aiLine = when (state) {
                    OnDeviceModelSetup.State.Ready -> "Runs offline on this phone"
                    OnDeviceModelSetup.State.Downloading -> "Downloading"
                    OnDeviceModelSetup.State.NotSupported -> "This phone uses cloud AI instead"
                }
            }
        }
        PackUpdater.updateIfNeeded(context)
        pack = AppServices.packStore.load()
    }

    StepLayout(
        step = OnboardingStep.GetReady,
        title = "Getting $city ready for when you're offline",
        button = "Start exploring",
        onButton = onDone,
    ) {
        val p = pack
        val redZones = p?.zones?.filter { it.level != ZoneLevel.Safer }.orEmpty()
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Item(Icons.Outlined.WarningAmber, HomewardColors.Red, HomewardColors.RedTint, "${if (p == null) "Red" else redZones.size.toString() + " red"} zones mapped", redZones.joinToString(", ") { it.name }.ifBlank { "Checking the city" }, done = p != null)
            Item(Icons.Outlined.Place, HomewardColors.Primary, HomewardColors.PrimaryTint, "${p?.safePlaces?.size ?: ""} safe places saved".trim(), "Police, hospitals, pharmacies", done = p != null)
            Item(Icons.AutoMirrored.Outlined.MenuBook, HomewardColors.Amber, HomewardColors.AmberTint, "$city safety pack", p?.let { "Police ${it.police}, ambulance ${it.ambulance}, embassy, key phrases" } ?: "Local numbers and phrases", done = p != null)
            Item(Icons.Outlined.Memory, HomewardColors.Primary, HomewardColors.PrimaryTint, "AI for your phone", aiLine, done = aiDone)
        }
    }
}

// One row: icon tile, what it is, and DONE in green once it's saved.
@Composable
private fun Item(icon: ImageVector, tint: Color, tile: Color, title: String, detail: String, done: Boolean) {
    WhiteCard(Modifier.fillMaxWidth(), padding = 14) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            IconCircle(icon, tint = tint, background = tile)
            Column(Modifier.weight(1f)) { Text(title, style = HomewardType.Label); Text(detail, style = HomewardType.Small) }
            Text(if (done) "DONE" else "…", style = HomewardType.MapLabel, color = if (done) HomewardColors.Green else HomewardColors.Primary)
        }
    }
}
