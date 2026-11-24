package app.beacon.design

import androidx.compose.ui.graphics.Color

// All app colors in one place. Same values as the Figma variables ("Beacon colors").
// Change a color here and it changes on every screen.
object BeaconColors {
    val Background = Color(0xFFF4F5F7)   // light grey page background
    val Surface = Color(0xFFFFFFFF)      // white cards
    val SurfaceAlt = Color(0xFFF3F4F6)   // input boxes, chips
    val Border = Color(0xFFE7E9ED)
    val Text = Color(0xFF1B1D22)
    val TextMuted = Color(0xFF6B7280)
    val Red = Color(0xFFD92B33)          // SOS + primary actions only
    val RedTint = Color(0x1AD92B33)      // 10% red, icon circles
    val Green = Color(0xFF1E9E62)        // "OK", safer zones, delivered
    val Yellow = Color(0xFFE0A10F)       // "careful" zones
    val Blue = Color(0xFF2563EB)         // your location dot
}
