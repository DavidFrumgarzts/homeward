package app.homeward.design

import androidx.compose.ui.graphics.Color

// All app colors in one place. Same values as the Figma variables ("Homeward colors").
// Change a color here and it changes on every screen.
object HomewardColors {
    val Background = Color(0xFFF3F6FB)   // light, slightly blue page background (calm)
    val Surface = Color(0xFFFFFFFF)      // white cards
    val SurfaceAlt = Color(0xFFF3F4F6)   // input boxes, chips
    val Border = Color(0xFFE7E9ED)
    val Text = Color(0xFF1B1D22)
    val TextMuted = Color(0xFF6B7280)
    val Primary = Color(0xFF2E6BE6)      // calm blue: buttons, links, icons (Figma "color/primary")
    val PrimaryTint = Color(0x1A2E6BE6)  // 10% blue, icon circles
    val Red = Color(0xFFD92B33)          // ONLY for SOS, police call and red-zone warnings
    val RedTint = Color(0x1AD92B33)      // 10% red, warning tags
    val Green = Color(0xFF1E9E62)        // "OK", safer zones, delivered
    val Yellow = Color(0xFFE0A10F)       // "careful" zones
    val Blue = Color(0xFF2563EB)         // your location dot
}
