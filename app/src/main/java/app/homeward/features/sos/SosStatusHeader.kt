package app.homeward.features.sos

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType

// The top of the SOS sent screen (Figma "09 SOS sent"): the ring, the headline and what is still on its way.
// The green tick and "knows" appear ONLY when a message was reported delivered; until then the ring is
// blue with a clock and the words say exactly where the message is (DeliveryWording).
@Composable
fun SosStatusHeader(summary: DeliveryWording.Summary, ended: Boolean, testMode: Boolean) {
    val good = summary.anyDelivered || ended
    val tint = if (good) HomewardColors.Green else HomewardColors.Primary
    val tile = if (good) HomewardColors.GreenTint else HomewardColors.PrimaryTint
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(Modifier.size(132.dp), contentAlignment = Alignment.Center) {
            Canvas(Modifier.fillMaxSize()) {
                drawCircle(tint.copy(alpha = 0.18f), style = Stroke(3.dp.toPx()))
                drawCircle(tile, radius = 46.dp.toPx())
            }
            Icon(if (good) Icons.Outlined.Check else Icons.Outlined.Schedule, null, tint = tint, modifier = Modifier.size(52.dp))
        }
        Text(if (ended) "SOS ended" else summary.headline, style = HomewardType.Title, textAlign = TextAlign.Center)
        if (ended) Text("Your contacts are being told it is over. Location sharing has stopped.", style = HomewardType.Body, color = HomewardColors.TextMuted, textAlign = TextAlign.Center)
        else summary.lines.forEach { line ->
            Text(line, style = HomewardType.Body, color = if (line.startsWith("Couldn't")) HomewardColors.Red else HomewardColors.TextMuted, textAlign = TextAlign.Center)
        }
        if (testMode) TestModeTag()
    }
}

// Debug builds only: makes it impossible to mistake a test run for a real SOS.
@Composable
fun TestModeTag() {
    Text("Test mode: no real SMS", style = HomewardType.Small, color = HomewardColors.Amber, modifier = Modifier.background(HomewardColors.AmberTint, RoundedCornerShape(50)).padding(horizontal = 12.dp, vertical = 4.dp))
}
