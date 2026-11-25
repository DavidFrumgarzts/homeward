import SwiftUI

// All app colors in one place. Same values as the Figma variables ("Beacon v2 colors") and Android's
// design/Colors.kt. Change a color here and it changes on every screen.
enum BeaconColors {
    static let background = Color(hex: 0xF7F4EE)   // warm paper background
    static let surface = Color(hex: 0xFFFFFF)      // white cards
    static let surfaceAlt = Color(hex: 0xEFEAE0)   // input boxes, chips
    static let border = Color(hex: 0xE3DED4)       // soft warm lines
    static let text = Color(hex: 0x101A33)         // ink
    static let textMuted = Color(hex: 0x5E6880)
    static let primary = Color(hex: 0x2F6BFF)      // blue: buttons, links, icons
    static let primaryTint = Color(hex: 0xE7EEFF)  // light blue icon tiles
    static let red = Color(hex: 0xE5484D)          // ONLY for SOS, the police call and red-zone warnings
    static let redTint = Color(hex: 0xFDE4E4)
    static let green = Color(hex: 0x22A06B)        // "OK", done, delivered
    static let greenTint = Color(hex: 0xE4F4EC)
    static let yellow = Color(hex: 0xE0A10F)       // "careful" zones
    static let amber = Color(hex: 0xE07A2B)        // warm accent icon color
    static let amberTint = Color(hex: 0xFFEBDA)

    // Night colors: only for the picture on the Welcome step.
    static let night = Color(hex: 0x0A1630)
    static let nightLine = Color(hex: 0x22396B)

    // Drawn map colors (Features/LapaMap): a light grey city map with white streets.
    static let mapPaper = Color(hex: 0xE9EBEE)
    static let mapStreet = Color(hex: 0xFFFFFF)
    static let mapPark = Color(hex: 0xCFE6CB)
    static let mapSand = Color(hex: 0xFAF3DF)
    static let mapWater = Color(hex: 0xB9E0F7)
    static let mapTree = Color(hex: 0xA5D3A0)
    static let mapTreeLine = Color(hex: 0x5E9B6B)
    static let mapNavy = Color(hex: 0x1F3A6E)
    static let mapZone = Color(hex: 0xF4C3BC)
    static let mapZoneLabel = Color(hex: 0xB4282D)
}

extension Color {
    // 0xRRGGBB
    init(hex: UInt32, opacity: Double = 1) {
        self.init(.sRGB, red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255, opacity: opacity)
    }
}
