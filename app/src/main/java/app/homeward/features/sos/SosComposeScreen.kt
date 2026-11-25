package app.homeward.features.sos

import android.content.Intent
import android.speech.RecognizerIntent
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.homeward.app.AppServices
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.PrimaryButton

// SOS, step 1: say what's happening (type, speak or tap a quick pick). The message for her contacts
// is there from the first moment (a plain template) and is rewritten by the AI when she pauses.
// She can edit it, and nothing is sent until she presses Send. Back cancels the SOS.
// It only draws IncidentViewState and calls the engine's intents.
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SosComposeScreen(onCancelled: () -> Unit) {
    val engine = AppServices.incident
    val view by engine.view.collectAsState()
    val names = remember { DeliveryWording.joinNames(AppServices.contacts.all().map { it.name }) }
    var words by rememberSaveable { mutableStateOf(view.description) }
    var noSpeech by remember { mutableStateOf(false) }
    fun describe(text: String) { words = text; engine.describe(text) }
    fun add(more: String) = describe(if (words.isBlank()) more else "${words.trim()}, ${more.replaceFirstChar { it.lowercase() }}")

    // The phone's own speech-to-text screen: she speaks, the words land in the box.
    val speech = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull()?.takeIf { it.isNotBlank() }?.let(::add)
    }
    val cancel = { engine.cancel(); onCancelled() }
    BackHandler(onBack = cancel)

    Column(Modifier.fillMaxSize().background(HomewardColors.Background).systemBarsPadding().imePadding().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(cancel) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Cancel the SOS", tint = HomewardColors.Primary) }
                Text("What's happening?", style = HomewardType.Title)
            }
            if (view.testMode) TestModeTag()

            Row(Modifier.fillMaxWidth().background(HomewardColors.Surface, RoundedCornerShape(22.dp)).padding(start = 6.dp, end = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                TextField(
                    words, ::describe, modifier = Modifier.weight(1f), textStyle = HomewardType.Body,
                    placeholder = { Text("A few words are enough", color = HomewardColors.TextMuted) }, colors = plainField(),
                )
                IconButton(
                    onClick = {
                        val ask = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM).putExtra(RecognizerIntent.EXTRA_PROMPT, "Say what's happening")
                        runCatching { speech.launch(ask) }.onFailure { noSpeech = true }
                    },
                    modifier = Modifier.size(48.dp).background(HomewardColors.Primary, RoundedCornerShape(16.dp)),
                ) { Icon(Icons.Outlined.Mic, "Speak instead of typing", tint = Color.White) }
            }
            if (noSpeech) Text("This phone has no speech-to-text. Type or tap below.", style = HomewardType.Small)

            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("Being followed", "Feel unsafe", "Hurt", "Lost", "In a vehicle").forEach { pick ->
                    // The same outlined pill as the ready-made questions on Home (Figma "07 Home").
                    Box(
                        Modifier.heightIn(min = 48.dp).clip(RoundedCornerShape(50)).border(1.dp, HomewardColors.Border, RoundedCornerShape(50)).clickable { add(pick) }.padding(horizontal = 16.dp),
                        contentAlignment = Alignment.Center,
                    ) { Text(pick, style = HomewardType.Label) }
                }
            }

            ContactMessageCard(names, view.contactMessage, view.contactMessageRanOnDevice, view.writingMessage, onEdit = engine::editMessage)
        }

        if (names.isBlank()) Text("No one gets your SOS yet. Add someone from Home, or call ${view.emergencyLabel} ${view.emergencyNumber}.", style = HomewardType.Small, color = HomewardColors.Red)
        PrimaryButton(if (names.isBlank()) "Send" else "Send to $names", color = HomewardColors.Red, enabled = names.isNotBlank() && view.contactMessage.isNotBlank()) { engine.send() }
    }
}

// A text field with no box of its own: it already sits inside a white card.
@Composable
internal fun plainField() = TextFieldDefaults.colors(
    focusedContainerColor = Color.Transparent, unfocusedContainerColor = Color.Transparent,
    focusedIndicatorColor = Color.Transparent, unfocusedIndicatorColor = Color.Transparent,
)
