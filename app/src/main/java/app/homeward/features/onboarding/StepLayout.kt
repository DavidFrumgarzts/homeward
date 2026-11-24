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
import app.homeward.design.components.ProgressDots
import app.homeward.design.components.RedButton

// Shared frame for every onboarding step: progress dots, title, short text, content, one red button at the bottom.
@Composable
fun StepLayout(
    step: OnboardingStep,
    title: String,
    subtitle: String,
    button: String,
    buttonEnabled: Boolean = true,
    footnote: String? = null,
    onButton: () -> Unit,
    header: (@Composable () -> Unit)? = null, // shown above the title (the logo on Welcome)
    content: @Composable ColumnScope.() -> Unit = {},
) {
    Column(Modifier.fillMaxSize().background(HomewardColors.Background).padding(horizontal = 24.dp, vertical = 28.dp)) {
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(18.dp)) {
            Spacer(Modifier.height(20.dp))
            ProgressDots(step.ordinal, OnboardingSteps.all.size)
            header?.invoke()
            Text(title, style = HomewardType.Title)
            Text(subtitle, style = HomewardType.Small)
            content()
        }
        RedButton(button, enabled = buttonEnabled, onClick = onButton)
        footnote?.let { Text(it, style = HomewardType.Small, modifier = Modifier.padding(top = 8.dp)) }
    }
}
