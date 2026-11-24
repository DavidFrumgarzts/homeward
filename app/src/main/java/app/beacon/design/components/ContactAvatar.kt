package app.beacon.design.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.beacon.design.BeaconColors
import app.beacon.design.BeaconType

// One trusted contact: initial in a red circle, name underneath. Also used for "+ Add".
@Composable
fun ContactAvatar(initial: String, name: String, onClick: () -> Unit = {}) {
    Column(Modifier.clickable(onClick = onClick), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.size(48.dp).background(BeaconColors.RedTint, CircleShape), contentAlignment = Alignment.Center) {
            Text(initial, color = BeaconColors.Red, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        }
        Text(name, style = BeaconType.Small)
    }
}
