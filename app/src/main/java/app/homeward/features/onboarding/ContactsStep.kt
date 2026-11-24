package app.homeward.features.onboarding

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import app.homeward.app.AppServices
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.WhiteCard
import app.homeward.features.contacts.ContactsEditor
import app.homeward.features.contacts.ProfileEditor

// Setup step 2 (Figma "04 Who gets your SOS"): add at least one person. "Continue" stays off until there's one.
@Composable
fun ContactsStep(onNext: () -> Unit) {
    var count by remember { mutableIntStateOf(0) }
    StepLayout(
        step = OnboardingStep.Contacts,
        title = "Who should hear from you?",
        button = "Continue",
        buttonEnabled = OnboardingSteps.canContinue(OnboardingStep.Contacts, count),
        onButton = onNext,
    ) {
        ProfileEditor()
        ContactsEditor(onChange = { count = it })
        // Optional: let "I'm OK" include where she is. Off by default; an SOS always includes it.
        var share by remember { mutableStateOf(AppServices.locationSharing.onCheckIn) }
        WhiteCard(Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Add my location to \"I'm OK\"", style = HomewardType.Label)
                    Text("Only when you tap it. Beacon shares where you are only in an SOS or a Safe Walk you start.", style = HomewardType.Small)
                }
                Switch(share, { share = it; AppServices.locationSharing.onCheckIn = it },
                    colors = SwitchDefaults.colors(checkedTrackColor = HomewardColors.Primary))
            }
        }
    }
}
