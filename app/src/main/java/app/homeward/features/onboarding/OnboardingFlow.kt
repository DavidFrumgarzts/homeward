package app.homeward.features.onboarding

import androidx.activity.compose.BackHandler
import androidx.compose.runtime.*
import app.homeward.app.AppServices

// Runs the 5 onboarding steps in order (back button goes one step back), then marks it done.
@Composable
fun OnboardingFlow(onFinished: () -> Unit) {
    var step by remember { mutableStateOf(OnboardingStep.Welcome) }
    val next = { OnboardingSteps.next(step)?.let { step = it } }
    OnboardingSteps.previous(step)?.let { prev -> BackHandler { step = prev } }

    when (step) {
        OnboardingStep.Welcome -> WelcomeStep(onNext = { next() })
        OnboardingStep.Story -> StoryStep(onNext = { next() })
        OnboardingStep.Contacts -> ContactsStep(onNext = { next() })
        OnboardingStep.Permissions -> PermissionsStep(onNext = { next() })
        OnboardingStep.GetReady -> GetReadyStep(onDone = { AppServices.onboarding.markDone(); onFinished() })
    }
}
