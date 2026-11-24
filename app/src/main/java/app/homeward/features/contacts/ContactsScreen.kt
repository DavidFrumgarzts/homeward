package app.homeward.features.contacts

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType

// Who gets the SOS (opened from "Edit" on Home). The list + form live in ContactsEditor.kt.
@Composable
fun ContactsScreen(onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().background(HomewardColors.Background).verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back", tint = HomewardColors.Primary) }
            Text("Who gets your SOS", style = HomewardType.Title)
        }
        Text("Only these people see your exact location, and only after you send an SOS.", style = HomewardType.Small)
        ContactsEditor()
    }
}
