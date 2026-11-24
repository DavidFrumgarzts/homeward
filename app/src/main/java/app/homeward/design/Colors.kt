package app.homeward.design

import androidx.compose.ui.graphics.Color

// All app colors in one place. Same values as the Figma variables ("Beacon v2 colors").
// Change a color here and it changes on every screen.
object HomewardColors {
    val Background = Color(0xFFF7F4EE)   // warm paper background (Figma "bg/warm")
    val Surface = Color(0xFFFFFFFF)      // white cards
    val SurfaceAlt = Color(0xFFEFEAE0)   // input boxes, chips
    val Border = Color(0xFFE3DED4)       // soft warm lines (Figma "line/soft")
    val Text = Color(0xFF101A33)         // ink
    val TextMuted = Color(0xFF5E6880)
    val Primary = Color(0xFF2F6BFF)      // blue: buttons, links, icons (Figma "blue/primary")
    val PrimaryTint = Color(0xFFE7EEFF)  // light blue icon tiles
    val Red = Color(0xFFE5484D)          // ONLY for SOS, police call and red-zone warnings
    val RedTint = Color(0xFFFDE4E4)      // light red icon tiles and tags
    val Green = Color(0xFF22A06B)        // "OK", done, delivered
    val GreenTint = Color(0xFFE4F4EC)
    val Yellow = Color(0xFFE0A10F)       // "careful" zones
    val Amber = Color(0xFFE07A2B)        // warm accent icon color
    val AmberTint = Color(0xFFFFEBDA)    // warm accent icon tiles
    val Blue = Color(0xFF2F6BFF)         // your location dot

    // Night colors: only for the Rio story at the start of onboarding.
    val Night = Color(0xFF0A1630)
    val NightCard = Color(0xFF13244A)
    val NightLine = Color(0xFF22396B)
    val NightRoad = Color(0xFF2C4A85)
    val OnNight = Color(0xFFEAF0FF)
    val OnNightMuted = Color(0xFF93A3C7)
    val Sky = Color(0xFF7FB2FF)          // the safe route on the night map

    // Illustrated map colors (features/lapamap).
    val MapPaper = Color(0xFFF7EDD8)
    val MapStreet = Color(0xFFEFDFBF)
    val MapStreetMajor = Color(0xFFE6D2A6)
    val MapPark = Color(0xFFCFE3C4)
    val MapTree = Color(0xFF7FB77E)
    val MapTreeLine = Color(0xFF3E7B4F)
    val MapNavy = Color(0xFF1F3A6E)      // the main avenue, landmark outlines and labels
}
