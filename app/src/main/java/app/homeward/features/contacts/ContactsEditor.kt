package app.homeward.features.contacts

import android.content.Intent
import android.provider.ContactsContract.CommonDataKinds.Phone
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import app.homeward.app.AppServices
import app.homeward.contacts.PhoneNumber
import app.homeward.contacts.TrustedContact
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.WhiteCard

// The list + "add person" form, shared by the Contacts screen and onboarding step 2.
// Saves on every change. `onChange` reports the new count so onboarding can enable "Continue".
@Composable
fun ContactsEditor(onChange: (Int) -> Unit = {}) {
    var contacts by remember { mutableStateOf(AppServices.contacts.all()) }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    val phoneOk = PhoneNumber.isValid(phone)

    fun save(list: List<TrustedContact>) { contacts = list; AppServices.contacts.save(list); onChange(list.size) }
    LaunchedEffect(Unit) { onChange(contacts.size) }

    // "Choose from contacts": Android's own contact picker. No contacts permission needed,
    // we only get the one person picked. Numbers with a country code are added straight away;
    // others go into the form so the user can add the code.
    val context = LocalContext.current
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val uri = result.data?.data ?: return@rememberLauncherForActivityResult
        context.contentResolver.query(uri, arrayOf(Phone.DISPLAY_NAME, Phone.NUMBER), null, null, null)?.use { c ->
            if (!c.moveToFirst()) return@use
            val pickedName = c.getString(0).orEmpty()
            val pickedPhone = c.getString(1).orEmpty()
            if (PhoneNumber.isValid(pickedPhone)) save(contacts + TrustedContact(pickedName, PhoneNumber.clean(pickedPhone)))
            else { name = pickedName; phone = pickedPhone }
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (contacts.isNotEmpty()) WhiteCard(Modifier.fillMaxWidth(), padding = 0) {
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
        }
        Button(
            onClick = { picker.launch(Intent(Intent.ACTION_PICK, Phone.CONTENT_URI)) },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = HomewardColors.RedTint, contentColor = HomewardColors.Red),
        ) { Text("Choose from contacts") }
        Text("or type one in", style = HomewardType.Small)
        OutlinedTextField(name, { name = it }, label = { Text("Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(
            phone, { phone = it }, label = { Text("Phone with country code, e.g. +972…") }, singleLine = true,
            isError = phone.isNotBlank() && !phoneOk, modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
        )
        OutlinedButton(
            onClick = { save(contacts + TrustedContact(name.trim(), PhoneNumber.clean(phone))); name = ""; phone = "" },
            enabled = name.isNotBlank() && phoneOk,
            modifier = Modifier.fillMaxWidth().height(52.dp),
        ) { Text("+ Add person", color = if (name.isNotBlank() && phoneOk) HomewardColors.Red else HomewardColors.TextMuted) }
    }
}
