package app.homeward.features.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.homeward.design.HomewardColors
import app.homeward.design.HomewardType

// Citizen-style alert rows: colored dot, small status line, bold headline, area + distance.
@Composable
fun NearbyList(items: List<NearbyFeed.Item>) {
    if (items.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Nearby", style = HomewardType.Label)
        items.forEach { item ->
            val color = when (item.kind) {
                NearbyFeed.Kind.Avoid -> HomewardColors.Red
                NearbyFeed.Kind.Careful -> HomewardColors.Yellow
                NearbyFeed.Kind.SafePlace -> HomewardColors.Green
            }
            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(Modifier.padding(top = 5.dp).size(10.dp).background(color, CircleShape))
                Column(Modifier.weight(1f)) {
                    Text(item.status, color = color, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Text(item.headline, style = HomewardType.Label, maxLines = 1)
                    Text("${item.detail} · ${NearbyFeed.distance(item.meters)}", style = HomewardType.Small, maxLines = 1)
                }
            }
        }
    }
}
