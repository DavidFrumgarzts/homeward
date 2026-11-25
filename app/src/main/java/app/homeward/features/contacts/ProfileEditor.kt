package app.homeward.features.contacts

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import app.homeward.app.AppServices
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.profile.Pronoun

// "Your first name" and how messages should refer to you. Shown above the contacts list, in onboarding
// and on the Contacts screen. Saves on every change. The default uses the name only: no pronoun is assumed.
@Composable
fun ProfileEditor() {
    var profile by remember { mutableStateOf(AppServices.profile.load()) }
    fun save(next: app.homeward.profile.UserProfile) { profile = next; AppServices.profile.save(next) }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(profile.name, { save(profile.copy(name = it)) }, label = { Text("Your first name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Text("In messages, refer to me as", style = HomewardType.Small)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(Pronoun.UseName to "my name", Pronoun.She to "she", Pronoun.He to "he", Pronoun.They to "they").forEach { (pronoun, label) ->
                // Outlined pill like the Home chips; the chosen one turns soft blue.
                val on = profile.pronoun == pronoun
                val shape = RoundedCornerShape(50)
                Box(
                    Modifier.heightIn(min = 48.dp).clip(shape).background(if (on) HomewardColors.PrimaryTint else HomewardColors.Background)
                        .border(1.dp, if (on) HomewardColors.Primary else HomewardColors.Border, shape)
                        .selectable(selected = on, role = Role.RadioButton) { save(profile.copy(pronoun = pronoun)) }.padding(horizontal = 16.dp),
                    contentAlignment = Alignment.Center,
                ) { Text(label, style = HomewardType.Label, color = if (on) HomewardColors.Primary else HomewardColors.Text) }
            }
        }
    }
}
