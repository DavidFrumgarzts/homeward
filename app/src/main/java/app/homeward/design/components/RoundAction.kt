package app.homeward.design.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.homeward.design.HomewardColors

// Round grey button with a label under it (Waze / Find My style). Used for Photo, Safe place, Police.
@Composable
fun RoundAction(label: String, icon: ImageVector, onClick: () -> Unit) {
    Column(Modifier.clickable(onClick = onClick), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(Modifier.size(56.dp).background(HomewardColors.SurfaceAlt, CircleShape), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = label, tint = HomewardColors.Text)
        }
        Text(label, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = HomewardColors.Text)
    }
}
