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

// Step 2: add at least one person who gets the SOS. "Continue" stays off until there's one.
@Composable
fun ContactsStep(onNext: () -> Unit) {
    var count by remember { mutableIntStateOf(0) }
    StepLayout(
        step = OnboardingStep.Contacts,
        title = "Who gets your SOS?",
        subtitle = "They see your exact location only after you send an SOS. Add at least one person.",
        button = "Continue",
        buttonEnabled = OnboardingSteps.canContinue(OnboardingStep.Contacts, count),
        onButton = onNext,
    ) {
        ContactsEditor(onChange = { count = it })
        // Optional: let check-ins include where she is. Off by default; SOS always includes it.
        var share by remember { mutableStateOf(AppServices.locationSharing.onCheckIn) }
        WhiteCard(Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Share my location when I say I'm OK", style = HomewardType.Label)
                    Text("Only when you tap \"I'm OK\". No live tracking.", style = HomewardType.Small)
                }
                Switch(share, { share = it; AppServices.locationSharing.onCheckIn = it },
                    colors = SwitchDefaults.colors(checkedTrackColor = HomewardColors.Primary))
            }
        }
    }
}
