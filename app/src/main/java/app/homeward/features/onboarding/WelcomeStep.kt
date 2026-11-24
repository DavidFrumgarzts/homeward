package app.homeward.features.onboarding

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.outlined.RadioButtonChecked
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.design.components.IconCircle
import app.homeward.design.components.WhiteCard

// Setup step 1 (Figma "03 Welcome"): what Beacon does, in three lines.
@Composable
fun WelcomeStep(onNext: () -> Unit) {
    StepLayout(
        step = OnboardingStep.Welcome,
        title = "Go anywhere.\nBeacon has your back, even with no signal.",
        button = "Set up in 1 minute",
        onButton = onNext,
        header = { BeaconRings() },
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Feature(Icons.Outlined.WarningAmber, HomewardColors.Red, HomewardColors.RedTint, "Warns you before a red zone", "The phone buzzes before you turn into an unsafe street.")
            Feature(Icons.AutoMirrored.Outlined.Chat, HomewardColors.Primary, HomewardColors.PrimaryTint, "Ask Beacon, offline", "The police number, a safe place, what to do. No data needed.")
            Feature(Icons.Outlined.RadioButtonChecked, HomewardColors.Amber, HomewardColors.AmberTint, "SOS with no signal", "A few words, and your family gets it by text.")
        }
    }
}

// The picture at the top: a beacon sending rings out over a night map.
@Composable
private fun BeaconRings() {
    Canvas(Modifier.fillMaxWidth().height(170.dp).clip(RoundedCornerShape(28.dp))) {
        drawRect(HomewardColors.Night)
        val w = size.width; val h = size.height
        val line = 1.5.dp.toPx()
        drawLine(HomewardColors.NightLine, Offset(0f, h * 0.26f), Offset(w, h * 0.21f), line)
        drawLine(HomewardColors.NightLine, Offset(0f, h * 0.63f), Offset(w, h * 0.71f), line)
        drawLine(HomewardColors.NightLine, Offset(w * 0.23f, 0f), Offset(w * 0.27f, h), line)
        drawLine(HomewardColors.NightLine, Offset(w * 0.72f, 0f), Offset(w * 0.70f, h), line)
        val center = Offset(w / 2, h / 2)
        drawCircle(HomewardColors.Primary.copy(alpha = 0.25f), 70.dp.toPx(), center, style = Stroke(2.dp.toPx()))
        drawCircle(HomewardColors.Primary.copy(alpha = 0.5f), 46.dp.toPx(), center, style = Stroke(2.dp.toPx()))
        drawCircle(HomewardColors.Primary, 24.dp.toPx(), center)
        drawCircle(Color.White, 9.dp.toPx(), center)
        drawCircle(Color(0xFFFF9B4A), 6.dp.toPx(), Offset(w * 0.79f, h * 0.27f))
        drawCircle(HomewardColors.Green, 5.dp.toPx(), Offset(w * 0.19f, h * 0.74f))
    }
}

@Composable
private fun Feature(icon: ImageVector, tint: Color, tile: Color, title: String, detail: String) {
    WhiteCard(Modifier.fillMaxWidth(), padding = 14) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            IconCircle(icon, tint = tint, background = tile)
            Column { Text(title, style = HomewardType.Label); Text(detail, style = HomewardType.Small) }
        }
    }
}
