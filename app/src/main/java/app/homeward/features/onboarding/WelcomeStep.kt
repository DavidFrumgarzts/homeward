package app.homeward.features.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material.icons.outlined.SignalCellularConnectedNoInternet0Bar
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.IconCircle

// Step 1, the landing screen: what Homeward is, in three lines.
@Composable
fun WelcomeStep(onNext: () -> Unit) {
    StepLayout(
        step = OnboardingStep.Welcome,
        title = "Homeward",
        subtitle = "Safety help that works with no signal. For you, and for the people waiting to hear you got home.",
        button = "Get started",
        onButton = onNext,
        header = {
            Box(Modifier.size(64.dp).background(HomewardColors.Primary, CircleShape), contentAlignment = Alignment.Center) {
                Icon(Icons.Outlined.Home, null, tint = Color.White)
            }
        },
    ) {
        Feature(Icons.Outlined.Place, "Warns you before risky streets", "A map of the city, saved to your phone")
        Feature(Icons.Outlined.SignalCellularConnectedNoInternet0Bar, "SOS with no signal", "Sent by text when there's no data")
        Feature(Icons.Outlined.FavoriteBorder, "Family knows you're OK", "Only when you choose to share")
    }
}

@Composable
private fun Feature(icon: ImageVector, title: String, detail: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        IconCircle(icon)
        Column { Text(title, style = HomewardType.Label); Text(detail, style = HomewardType.Small) }
    }
}
