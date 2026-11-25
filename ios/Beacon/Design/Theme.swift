import SwiftUI

// Corner radii and spacing, the same numbers David uses in the Android app (design/components and the
// screens on main) and in the Figma file "Beacon v2". Colors are in Colors.swift, text in Type.swift.
// Use these instead of typing numbers into a screen, so every screen keeps the same look.
enum BeaconRadius {
    static let card: CGFloat = 22        // WhiteCard, the Ask box, the red-zone banner
    static let button: CGFloat = 18      // PrimaryButton, I'm OK / Police
    static let holdButton: CGFloat = 20  // Hold for SOS, the call button, outlined place card
    static let sheet: CGFloat = 30       // Home's bottom sheet, the story's text panel
    static let picture: CGFloat = 28     // the night picture on Welcome
    static let tile: CGFloat = 14        // IconCircle
    static let smallTile: CGFloat = 12   // the 40 pt place tile on Home
    static let field: CGFloat = 16       // text fields, the blue square in the Ask box
    static let bubble: CGFloat = 20      // chat bubbles
}

enum BeaconSpacing {
    static let screen: CGFloat = 24      // side margins on setup steps
    static let sheet: CGFloat = 20       // side margins on Home's sheet, Ask Beacon and the SOS screens
    static let section: CGFloat = 20     // between the title and the content on a setup step
    static let stack: CGFloat = 14       // between blocks on Home's sheet
    static let cards: CGFloat = 10       // between cards in a list
}

// Heights of the big controls (Figma "Button/Primary" and "Button/Hold").
enum BeaconSize {
    static let button: CGFloat = 56
    static let holdButton: CGFloat = 64
    static let quickAction: CGFloat = 52
    static let askBox: CGFloat = 60
    static let send: CGFloat = 48
    static let iconTile: CGFloat = 44
}

extension TextLook {
    // The "DONE" / "64%" tags on the Get ready step (Figma shows them in a monospaced face).
    static let status = TextLook(font: .system(size: 13, weight: .bold, design: .monospaced), color: BeaconColors.green, tracking: 0.6)
}

// David's Android names for the same components, so code reads the same on both platforms.
typealias IconCircle = IconTile
typealias ProgressDots = ProgressBars
