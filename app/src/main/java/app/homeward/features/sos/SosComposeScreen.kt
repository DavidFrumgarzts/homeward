package app.homeward.features.sos

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.homeward.app.AppServices
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.RedButton

// Step 1 of SOS: say what's happening (type or tap a quick pick), the phone's AI writes the
// message, she checks it, and sends it with one tap.
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SosComposeScreen(vm: SosViewModel, onBack: () -> Unit, onSent: () -> Unit) {
    val names = AppServices.contacts.all().joinToString(", ") { it.name }

    Column(Modifier.fillMaxSize().background(HomewardColors.Background).padding(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back", tint = HomewardColors.Red) }
            Text("What's happening?", style = HomewardType.Title)
        }

        OutlinedTextField(
            value = vm.note, onValueChange = { vm.note = it },
            modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp),
            placeholder = { Text("e.g. guy following me since the bar, grey hoodie") },
        )

        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Being followed", "Feel unsafe", "Hurt", "Lost").forEach { pick ->
                AssistChip(onClick = { vm.addQuickPick(pick) }, label = { Text(pick) }, shape = RoundedCornerShape(50))
            }
        }

        if (vm.draft.isBlank()) {
            RedButton(if (vm.isWriting) "Writing..." else "Write my SOS", enabled = vm.note.isNotBlank() && !vm.isWriting) { vm.writeDraft() }
        } else {
            // The AI draft, editable. She is always in control of what is sent.
            Column(Modifier.border(BorderStroke(1.5.dp, HomewardColors.Red), RoundedCornerShape(20.dp)).background(HomewardColors.Surface, RoundedCornerShape(20.dp)).padding(18.dp)) {
                Text("Your message", style = HomewardType.Label)
                Spacer(Modifier.height(8.dp))
                BasicDraftField(vm.draft) { vm.draft = it }
            }
            Spacer(Modifier.weight(1f))
            RedButton("Send to $names") { vm.send(onSent) }
        }
    }
}

// Plain editable text for the draft (no extra box, it already sits inside the card).
@Composable
private fun BasicDraftField(text: String, onChange: (String) -> Unit) {
    TextField(text, onChange, textStyle = HomewardType.Body, colors = TextFieldDefaults.colors(
        focusedContainerColor = HomewardColors.Surface, unfocusedContainerColor = HomewardColors.Surface,
        focusedIndicatorColor = HomewardColors.Surface, unfocusedIndicatorColor = HomewardColors.Surface,
    ))
}
