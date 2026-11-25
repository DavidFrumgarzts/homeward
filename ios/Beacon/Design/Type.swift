import SwiftUI
import UIKit

// Fonts, the same two as the Figma design and the Android app: Sora for headings, Inter for body text.
// Both files (shared with Android, from app/src/main/res/font) hold every weight in one file, so each
// weight is picked with the font's "weight" setting. Licenses (SIL Open Font License): docs/licenses.
enum BeaconFonts {
    static func sora(_ size: CGFloat, weight: CGFloat) -> Font { variable("Sora", size, weight) }
    static func inter(_ size: CGFloat, weight: CGFloat) -> Font { variable("Inter", size, weight) }

    private static func variable(_ family: String, _ size: CGFloat, _ weight: CGFloat) -> Font {
        // If the font file is missing from the bundle, use the system font at the same size and weight.
        guard UIFont.familyNames.contains(family) else { return .system(size: size, weight: systemWeight(weight)) }
        let weightAxis = 2003265652 // the four letters "wght" as a number, the name of the weight setting
        let variation = UIFontDescriptor.AttributeName(rawValue: kCTFontVariationAttribute as String)
        let descriptor = UIFontDescriptor(fontAttributes: [.family: family, variation: [weightAxis: weight]])
        return Font(UIFont(descriptor: descriptor, size: size))
    }

    private static func systemWeight(_ weight: CGFloat) -> Font.Weight {
        switch weight {
        case ..<450: .regular
        case ..<550: .medium
        case ..<650: .semibold
        default: .bold
        }
    }
}

// One text look: font, color and letter spacing. Use with `Text("…").style(.title)`.
struct TextLook: Sendable {
    var font: Font
    var color: Color = BeaconColors.text
    var tracking: CGFloat = 0
    var lineSpacing: CGFloat = 0
}

// Text sizes used across the app (Figma text styles "Beacon/…", same numbers as Android's Type.kt).
// Nothing smaller than 13 pt except map labels, so it stays readable in a panic.
extension TextLook {
    static let display = TextLook(font: BeaconFonts.sora(30, weight: 700), lineSpacing: 2)
    static let title = TextLook(font: BeaconFonts.sora(24, weight: 600), tracking: -0.4, lineSpacing: 2)
    static let heading = TextLook(font: BeaconFonts.sora(18, weight: 600), lineSpacing: 2)
    static let label = TextLook(font: BeaconFonts.inter(15, weight: 500))
    static let body = TextLook(font: BeaconFonts.inter(16, weight: 400), lineSpacing: 3)
    static let small = TextLook(font: BeaconFonts.inter(13, weight: 400), color: BeaconColors.textMuted, lineSpacing: 1)
    static let placeLabel = TextLook(font: BeaconFonts.inter(10, weight: 600), color: Color(hex: 0x3C4658))
    static let mapLabel = TextLook(font: BeaconFonts.sora(10, weight: 600), color: BeaconColors.mapNavy, tracking: 0.7)
}

extension View {
    func style(_ look: TextLook, color: Color? = nil) -> some View {
        font(look.font).foregroundStyle(color ?? look.color).tracking(look.tracking).lineSpacing(look.lineSpacing)
    }
}
