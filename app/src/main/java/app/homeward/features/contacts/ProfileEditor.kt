package app.homeward.features.contacts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
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
                FilterChip(profile.pronoun == pronoun, { save(profile.copy(pronoun = pronoun)) }, label = { Text(label) }, shape = RoundedCornerShape(50), modifier = Modifier.heightIn(min = 48.dp),
                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = HomewardColors.PrimaryTint, selectedLabelColor = HomewardColors.Primary))
            }
        }
    }
}
