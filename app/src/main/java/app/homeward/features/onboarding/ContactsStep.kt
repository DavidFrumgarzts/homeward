package app.homeward.features.onboarding

import androidx.compose.runtime.*
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
    ) { ContactsEditor(onChange = { count = it }) }
}
