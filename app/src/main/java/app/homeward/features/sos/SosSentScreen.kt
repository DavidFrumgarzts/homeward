package app.homeward.features.sos

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.homeward.app.AppServices
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.PrimaryButton
import app.homeward.design.components.WhiteCard
import app.homeward.features.incident.contracts.IncidentPhase
import app.homeward.features.sync.FamilyLink
import app.homeward.testmode.TestMode
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// After Send (Figma "09 SOS sent"), and for as long as the SOS is active: who really has the message,
// the message itself, what to do now, a phrase to show someone nearby, what is happening with her
// location, and a quiet way to end it. It only draws IncidentViewState and calls the engine's intents.
@Composable
fun SosSentScreen(onLeave: () -> Unit) {
    val engine = AppServices.incident
    val view by engine.view.collectAsState()
    val ended = view.phase == IncidentPhase.Resolved
    val summary = remember(view.deliveries) { DeliveryWording.summarize(view.deliveries) }
    var confirmEnd by remember { mutableStateOf(false) }
    val testTexts by TestMode.log.collectAsState()
    val sync by AppServices.incidentSync.status.collectAsState()
    fun clock(millis: Long) = SimpleDateFormat("h:mm a", Locale.US).format(Date(millis))
    val leave = { if (ended) engine.reset(); onLeave() }
    BackHandler(onBack = leave) // back goes to the map; an active SOS keeps running (Home shows it)

    Column(
        Modifier.fillMaxSize().background(HomewardColors.Background).systemBarsPadding().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp), horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        SosStatusHeader(summary, ended, view.testMode)

        // The message they were sent
        if (view.contactMessage.isNotBlank()) WhiteCard(Modifier.fillMaxWidth()) { Text(view.contactMessage, style = HomewardType.Small, color = HomewardColors.Text) }

        if (ended) {
            PrimaryButton("Back to the map", onClick = leave)
        } else {
            ForMeCard(view, onCall = engine::callEmergency)
            LocalPhrasesCard(listOfNotNull(view.showNearby))
            Text(
                SessionWording.locationLine(
                    hasFix = view.lastFix != null,
                    fixAgeMinutes = view.lastFix?.let { (System.currentTimeMillis() - it.takenAtMillis) / 60_000 },
                    lastUpdateTime = view.lastUpdateSentAtMillis?.let(::clock),
                    pointsWaiting = view.pointsWaiting,
                ),
                style = HomewardType.Small, modifier = Modifier.fillMaxWidth(),
            )
            SessionWording.linkLine(hasLink = view.contactMessage.contains(FamilyLink.HOST), sync.pending, sync.refused)?.let { Text(it, style = HomewardType.Small, modifier = Modifier.fillMaxWidth()) }
            TextButton({ confirmEnd = true }, Modifier.fillMaxWidth().heightIn(min = 48.dp)) { Text("I'm safe now, end SOS", style = HomewardType.Label, color = HomewardColors.TextMuted) }
        }

        // Debug builds only: the texts in the order a contact's phone would show them.
        if (view.testMode && testTexts.isNotEmpty()) WhiteCard(Modifier.fillMaxWidth()) {
            Text("Test mode: what your contacts would receive", style = HomewardType.Label)
            testTexts.forEach { Text(it, style = HomewardType.Small, color = HomewardColors.Text, modifier = Modifier.padding(top = 10.dp)) }
        }
    }

    if (confirmEnd) AlertDialog(
        onDismissRequest = { confirmEnd = false },
        title = { Text("End the SOS?") },
        text = { Text("Your contacts are told you are safe, and Beacon stops sharing your location.") },
        confirmButton = { TextButton({ confirmEnd = false; engine.imOk() }) { Text("Yes, I'm safe") } },
        dismissButton = { TextButton({ confirmEnd = false }) { Text("Keep it on") } },
    )
}
