package app.homeward.design.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import app.homeward.design.HomewardColors

// Red outline icon in a light-red circle (onboarding feature rows and permission cards).
@Composable
fun IconCircle(icon: ImageVector, size: Int = 44, modifier: Modifier = Modifier) {
    Box(modifier.size(size.dp).background(HomewardColors.RedTint, CircleShape), contentAlignment = Alignment.Center) {
        Icon(icon, contentDescription = null, tint = HomewardColors.Red, modifier = Modifier.size((size / 2).dp))
    }
}
