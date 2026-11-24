package app.homeward.design.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors

// An outline icon on a soft colored tile with rounded corners (feature rows, permission cards).
// Blue by default; pass a tint and background for the red and amber versions.
@Composable
fun IconCircle(icon: ImageVector, size: Int = 44, modifier: Modifier = Modifier, tint: Color = HomewardColors.Primary, background: Color = HomewardColors.PrimaryTint) {
    Box(modifier.size(size.dp).background(background, RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size((size / 2).dp))
    }
}
