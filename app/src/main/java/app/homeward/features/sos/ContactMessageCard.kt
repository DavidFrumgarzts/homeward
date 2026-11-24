package app.homeward.features.sos

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.InferenceBadge

// The "For my contacts" card on the compose screen: the message, editable, with a badge saying where
// it was written ("On device", "Cloud", or "No AI" for the plain template). She is always in control
// of what is sent: once she edits it, the AI never overwrites her words.
@Composable
fun ContactMessageCard(names: String, message: String, ranOnDevice: Boolean?, writing: Boolean, onEdit: (String) -> Unit) {
    // Local copy for smooth typing; it follows the engine when the AI (or a new location) changes the draft.
    var draft by remember { mutableStateOf(message) }
    LaunchedEffect(message) { if (message != draft) draft = message }

    Column(Modifier.fillMaxWidth().border(BorderStroke(1.5.dp, HomewardColors.Primary), RoundedCornerShape(20.dp)).background(HomewardColors.Surface, RoundedCornerShape(20.dp)).padding(top = 14.dp, bottom = 4.dp)) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(if (names.isBlank()) "Your message" else "Message to $names", style = HomewardType.Label, modifier = Modifier.weight(1f))
            if (writing) Text("Writing…", style = HomewardType.Small, color = HomewardColors.Primary) else InferenceBadge(ranOnDevice)
        }
        TextField(draft, { draft = it; onEdit(it) }, modifier = Modifier.fillMaxWidth(), textStyle = HomewardType.Body, colors = plainField())
    }
}
