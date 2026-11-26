package app.homeward.design.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType

// The small tag on every AI-written text saying where it was written: "On device" (Gemini Nano on
// this phone, works with no signal) or "Cloud". `null` means no AI wrote it (plain template or saved
// facts), and says so. The value comes from the SDK's `inferenceSource`, never from a guess.
@Composable
fun InferenceBadge(ranOnDevice: Boolean?, modifier: Modifier = Modifier) {
    val (label, tint, tile) = when (ranOnDevice) {
        true -> Triple("On device", HomewardColors.Green, HomewardColors.GreenTint)
        false -> Triple("Cloud", HomewardColors.Primary, HomewardColors.PrimaryTint)
        null -> Triple("No AI", HomewardColors.TextMuted, HomewardColors.SurfaceAlt)
    }
    Text(label, style = HomewardType.Small, color = tint, modifier = modifier.background(tile, RoundedCornerShape(50)).padding(horizontal = 10.dp, vertical = 3.dp))
}
