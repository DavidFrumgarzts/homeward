package app.homeward.features.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.HourglassEmpty
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import app.homeward.ai.OnDeviceModelSetup
import app.homeward.app.AppServices
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.WhiteCard
import app.homeward.features.safetypack.PackUpdater
import kotlinx.coroutines.launch

// Step 4: while on wifi, get everything needed offline: the safety pack (cloud AI + OpenStreetMap)
// and the on-device AI model. Shows live status. "Start" works any time; the rest keeps going.
@Composable
fun GetReadyStep(onDone: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var packLine by remember { mutableStateOf<String?>(null) }
    var placesLine by remember { mutableStateOf<String?>(null) }
    var aiLine by remember { mutableStateOf("Checking…") }
    var aiDone by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        scope.launch {
            OnDeviceModelSetup.ensureDownloaded { state ->
                aiDone = state != OnDeviceModelSetup.State.Downloading
                aiLine = when (state) {
                    OnDeviceModelSetup.State.Ready -> "Ready, works offline"
                    OnDeviceModelSetup.State.Downloading -> "Downloading…"
                    OnDeviceModelSetup.State.NotSupported -> "This phone uses cloud AI instead"
                }
            }
        }
        PackUpdater.updateIfNeeded(context)
        val pack = AppServices.packStore.load()
        packLine = "Police ${pack.police} · embassy · local phrases · red zones"
        placesLine = if (pack.placesFromOsm) "${pack.safePlaces.size} police stations, hospitals and pharmacies" else "Saved list (OpenStreetMap busy, will retry)"
    }

    StepLayout(
        step = OnboardingStep.GetReady,
        title = "Getting you ready to go offline",
        subtitle = "Stay on wifi for a minute. After this, Homeward works with no signal.",
        button = "Start using Homeward",
        footnote = "You can start now; the rest finishes in the background.",
        onButton = onDone,
    ) {
        WhiteCard(Modifier.fillMaxWidth(), padding = 0) {
            Item("Safety pack for ${AppServices.packStore.load().city}", packLine)
            HorizontalDivider(color = HomewardColors.Border)
            Item("Real safe places", placesLine)
            HorizontalDivider(color = HomewardColors.Border)
            Item("AI on your phone", if (aiDone) aiLine else null, waitingText = aiLine)
        }
    }
}

// One row: green check when done (detail shown), grey hourglass while waiting.
@Composable
private fun Item(title: String, detail: String?, waitingText: String = "Working…") {
    Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        val done = detail != null
        Box(Modifier.size(32.dp).background((if (done) HomewardColors.Green else HomewardColors.TextMuted).copy(alpha = 0.15f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(if (done) Icons.Outlined.Check else Icons.Outlined.HourglassEmpty, null, tint = if (done) HomewardColors.Green else HomewardColors.TextMuted, modifier = Modifier.size(18.dp))
        }
        Column {
            Text(title, style = HomewardType.Label)
            Text(detail ?: waitingText, style = HomewardType.Small, color = if (done) HomewardColors.TextMuted else HomewardColors.Red)
        }
    }
}
