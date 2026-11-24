package app.homeward.design

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Text sizes used across the app. Nothing smaller than 12sp so it stays readable in a panic.
object HomewardType {
    val Title = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold, color = HomewardColors.Text)
    val Heading = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold, color = HomewardColors.Text)
    val Label = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = HomewardColors.Text)
    val Body = TextStyle(fontSize = 15.sp, color = HomewardColors.Text, lineHeight = 21.sp)
    val Small = TextStyle(fontSize = 13.sp, color = HomewardColors.TextMuted)
}
