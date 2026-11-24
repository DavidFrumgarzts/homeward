package app.homeward.features.contacts

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import app.homeward.app.AppServices
import app.homeward.contacts.PhoneNumber
import app.homeward.contacts.TrustedContact
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.RedButton
import app.homeward.design.components.WhiteCard

// Who gets the SOS. Add a name + international number, remove with the X. Saved on the phone only.
@Composable
fun ContactsScreen(onBack: () -> Unit) {
    var contacts by remember { mutableStateOf(AppServices.contacts.all()) }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    val phoneOk = PhoneNumber.isValid(phone)

    fun save(list: List<TrustedContact>) { contacts = list; AppServices.contacts.save(list) }

    Column(Modifier.fillMaxSize().background(HomewardColors.Background).padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back", tint = HomewardColors.Red) }
            Text("Who gets your SOS", style = HomewardType.Title)
        }
        Text("Only these people see your exact location, and only after you send an SOS.", style = HomewardType.Small)

        WhiteCard(Modifier.fillMaxWidth(), padding = 0) {
            contacts.forEachIndexed { i, c ->
                if (i > 0) HorizontalDivider(color = HomewardColors.Border)
                Row(Modifier.fillMaxWidth().padding(start = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f).padding(vertical = 12.dp)) {
                        Text(c.name, style = HomewardType.Label)
                        Text(c.phone, style = HomewardType.Small)
                    }
                    IconButton({ save(contacts - c) }) { Icon(Icons.Outlined.Close, "Remove ${c.name}", tint = HomewardColors.TextMuted) }
                }
            }
            if (contacts.isEmpty()) Text("No one yet. Add at least one person.", style = HomewardType.Small, modifier = Modifier.padding(16.dp))
        }

        OutlinedTextField(name, { name = it }, label = { Text("Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(
            phone, { phone = it }, label = { Text("Phone with country code, e.g. +972...") }, singleLine = true,
            isError = phone.isNotBlank() && !phoneOk, modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
        )
        RedButton("Add", enabled = name.isNotBlank() && phoneOk) {
            save(contacts + TrustedContact(name.trim(), PhoneNumber.clean(phone)))
            name = ""; phone = ""
        }
    }
}
