package app.homeward.features.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType
import app.homeward.features.safetypack.SafetyZone

// Waze-style alert at the top of the map: "Red zone in 250 m". Only shown when one is close
// and risky at this hour. Tap it for the reasons and the nearest open safe place.
@Composable
fun RedZoneBanner(zone: SafetyZone, meters: Int, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val shape = RoundedCornerShape(22.dp)
    Row(
        modifier.fillMaxWidth().shadow(8.dp, shape).background(HomewardColors.Surface, shape).clickable(onClick = onClick).padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(Modifier.size(40.dp).background(HomewardColors.Red, RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
            Icon(Icons.Outlined.WarningAmber, null, tint = Color.White, modifier = Modifier.size(20.dp))
        }
        Column(Modifier.weight(1f)) {
            Text(if (meters == 0) "You're in a red zone" else "Red zone in $meters m", style = HomewardType.Label)
            Text("${zone.name} · empty at night", style = HomewardType.Small, maxLines = 1)
        }
        Icon(Icons.AutoMirrored.Outlined.KeyboardArrowRight, null, tint = HomewardColors.TextMuted)
    }
}
