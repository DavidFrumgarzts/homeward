package app.beacon.design

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Text sizes used across the app. Nothing smaller than 12sp so it stays readable in a panic.
object BeaconType {
    val Title = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold, color = BeaconColors.Text)
    val Heading = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold, color = BeaconColors.Text)
    val Label = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = BeaconColors.Text)
    val Body = TextStyle(fontSize = 15.sp, color = BeaconColors.Text, lineHeight = 21.sp)
    val Small = TextStyle(fontSize = 13.sp, color = BeaconColors.TextMuted)
}
