package app.homeward.design

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import app.homeward.R

// Fonts, the same two as the Figma design: Sora for headings, Inter for body text.
// Both files in res/font hold every weight in one file, so each weight is picked with a setting.
// Licenses (SIL Open Font License): docs/licenses.
@OptIn(ExperimentalTextApi::class)
object HomewardFonts {
    private fun sora(weight: FontWeight) = Font(R.font.sora, weight, variationSettings = FontVariation.Settings(FontVariation.weight(weight.weight)))
    private fun inter(weight: FontWeight) = Font(R.font.inter, weight, variationSettings = FontVariation.Settings(FontVariation.weight(weight.weight)))

    val Display: FontFamily = FontFamily(sora(FontWeight.SemiBold), sora(FontWeight.Bold))
    val Body: FontFamily = FontFamily(inter(FontWeight.Normal), inter(FontWeight.Medium), inter(FontWeight.SemiBold))
}

// Text sizes used across the app (Figma text styles "Beacon/…"). Nothing smaller than 13sp
// except map labels, so it stays readable in a panic.
object HomewardType {
    val Display = TextStyle(fontFamily = HomewardFonts.Display, fontSize = 30.sp, lineHeight = 36.sp, fontWeight = FontWeight.Bold, color = HomewardColors.Text)
    val Title = TextStyle(fontFamily = HomewardFonts.Display, fontSize = 24.sp, lineHeight = 30.sp, letterSpacing = (-0.4).sp, fontWeight = FontWeight.SemiBold, color = HomewardColors.Text)
    val Heading = TextStyle(fontFamily = HomewardFonts.Display, fontSize = 18.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold, color = HomewardColors.Text)
    val Label = TextStyle(fontFamily = HomewardFonts.Body, fontSize = 15.sp, lineHeight = 20.sp, fontWeight = FontWeight.Medium, color = HomewardColors.Text)
    val Body = TextStyle(fontFamily = HomewardFonts.Body, fontSize = 16.sp, lineHeight = 24.sp, color = HomewardColors.Text)
    val Small = TextStyle(fontFamily = HomewardFonts.Body, fontSize = 13.sp, lineHeight = 18.sp, color = HomewardColors.TextMuted)
    // Small capital letters on the map ("ARCOS DA LAPA") and time stamps in the story.
    // Place names under the map badges ("Police"). A soft white glow keeps them readable over streets.
    val PlaceLabel = TextStyle(fontFamily = HomewardFonts.Body, fontSize = 10.sp, lineHeight = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF3C4658), shadow = Shadow(Color.White, blurRadius = 6f))
    val MapLabel = TextStyle(fontFamily = HomewardFonts.Display, fontSize = 10.sp, lineHeight = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.7.sp, color = HomewardColors.MapNavy)
}
