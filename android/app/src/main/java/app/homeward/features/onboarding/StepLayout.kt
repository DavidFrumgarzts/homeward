package app.homeward.features.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.PrimaryButton
import app.homeward.design.components.ProgressDots

// Shared frame for every setup step: progress bars, optional picture, title, content,
// and one blue button at the bottom. No subheadline: the title says it.
@Composable
fun StepLayout(
    step: OnboardingStep,
    title: String,
    button: String,
    buttonEnabled: Boolean = true,
    onButton: () -> Unit,
    header: (@Composable () -> Unit)? = null, // shown above the title (the picture on Welcome)
    content: @Composable ColumnScope.() -> Unit = {},
) {
    Column(Modifier.fillMaxSize().background(HomewardColors.Background).systemBarsPadding().padding(start = 24.dp, end = 24.dp, top = 20.dp, bottom = 24.dp)) {
        ProgressDots(OnboardingSteps.progressIndex(step), OnboardingSteps.SETUP_STEPS)
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(top = 24.dp, bottom = 16.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
            header?.invoke()
            Text(title, style = HomewardType.Title)
            content()
        }
        PrimaryButton(button, enabled = buttonEnabled, onClick = onButton)
    }
}
