package app.beacon.design.components

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
import app.beacon.design.BeaconColors

// Red outline icon inside a light-red circle (quick actions, contacts header, safe place).
@Composable
fun IconCircle(icon: ImageVector, size: Int = 44, modifier: Modifier = Modifier) {
    Box(modifier.size(size.dp).background(BeaconColors.RedTint, CircleShape), contentAlignment = Alignment.Center) {
        Icon(icon, contentDescription = null, tint = BeaconColors.Red, modifier = Modifier.size((size / 2).dp))
    }
}
