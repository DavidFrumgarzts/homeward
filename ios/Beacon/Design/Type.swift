import SwiftUI
import UIKit

// Fonts, the same two as the Figma design and the Android app: Sora for headings, Inter for body text.
// Both files (shared with Android, from app/src/main/res/font) hold every weight in one file, so each
// weight is picked with the font's "weight" setting. Licenses (SIL Open Font License): docs/licenses.
// These two give a fixed size (used by the drawn map); screens use TextLook, which follows Dynamic Type.
enum BeaconFonts {
    static func sora(_ size: CGFloat, weight: CGFloat) -> Font { variable("Sora", size, weight) }
    static func inter(_ size: CGFloat, weight: CGFloat) -> Font { variable("Inter", size, weight) }

    // Looked up once: asking UIFont for every family on each redraw is slow.
    private static let installed: Set<String> = Set(UIFont.familyNames)

    private static func variable(_ family: String, _ size: CGFloat, _ weight: CGFloat) -> Font {
        // If the font file is missing from the bundle, use the system font at the same size and weight.
        guard installed.contains(family) else { return .system(size: size, weight: systemWeight(weight)) }
        let weightAxis = 2003265652 // the four letters "wght" as a number, the name of the weight setting
        let variation = UIFontDescriptor.AttributeName(rawValue: kCTFontVariationAttribute as String)
        let descriptor = UIFontDescriptor(fontAttributes: [.family: family, variation: [weightAxis: weight]])
        return Font(UIFont(descriptor: descriptor, size: size))
    }

    static func systemWeight(_ weight: CGFloat) -> Font.Weight {
        switch weight {
        case ..<450: .regular
        case ..<550: .medium
        case ..<650: .semibold
        default: .bold
        }
    }
}

// One text look: typeface, size, weight, color and letter spacing. Use with `Text("…").style(.title)`,
// or `.beaconFont(.body)` for text fields and buttons that set their own color.
// `scale` is the iOS text style the size grows with (Dynamic Type): at the default text size the look
// is exactly the Figma size; when she picks larger text in Settings, it grows like that system style.
struct TextLook: Sendable {
    enum Face: Sendable { case sora, inter, mono }
    enum Scale: Sendable { case fixed, largeTitle, title, title2, title3, headline, body, callout, subheadline, footnote, caption, caption2 }

    var face: Face
    var size: CGFloat
    var weight: CGFloat
    var scale: Scale = .body
    var color: Color = BeaconColors.text
    var tracking: CGFloat = 0
    var lineSpacing: CGFloat = 0

    // The font at the Figma size (no Dynamic Type), for places that can't scale, like the drawn map.
    var font: Font { font(size: size) }

    func font(size: CGFloat) -> Font {
        switch face {
        case .sora: BeaconFonts.sora(size, weight: weight)
        case .inter: BeaconFonts.inter(size, weight: weight)
        case .mono: .system(size: size, weight: BeaconFonts.systemWeight(weight), design: .monospaced)
        }
    }

    // A one-off look for a single place on a screen.
    static func inter(_ size: CGFloat, _ weight: CGFloat, _ scale: Scale, color: Color = BeaconColors.text) -> TextLook {
        TextLook(face: .inter, size: size, weight: weight, scale: scale, color: color)
    }

    static func sora(_ size: CGFloat, _ weight: CGFloat, _ scale: Scale, color: Color = BeaconColors.text) -> TextLook {
        TextLook(face: .sora, size: size, weight: weight, scale: scale, color: color)
    }
}

extension TextLook.Scale {
    var textStyle: Font.TextStyle {
        switch self {
        case .fixed, .body: .body
        case .largeTitle: .largeTitle
        case .title: .title
        case .title2: .title2
        case .title3: .title3
        case .headline: .headline
        case .callout: .callout
        case .subheadline: .subheadline
        case .footnote: .footnote
        case .caption: .caption
        case .caption2: .caption2
        }
    }
}

// Text sizes used across the app (Figma text styles "Beacon/…", same numbers as Android's Type.kt).
// Nothing smaller than 13 pt except map labels, so it stays readable in a panic.
extension TextLook {
    static let display = TextLook(face: .sora, size: 30, weight: 700, scale: .largeTitle, lineSpacing: 2)
    static let title = TextLook(face: .sora, size: 24, weight: 600, scale: .title, tracking: -0.4, lineSpacing: 2)
    static let heading = TextLook(face: .sora, size: 18, weight: 600, scale: .headline, lineSpacing: 2)
    static let label = TextLook(face: .inter, size: 15, weight: 500, scale: .subheadline)
    static let body = TextLook(face: .inter, size: 16, weight: 400, scale: .body, lineSpacing: 3)
    static let small = TextLook(face: .inter, size: 13, weight: 400, scale: .footnote, color: BeaconColors.textMuted, lineSpacing: 1)
    // Map labels are part of the drawing, so they keep their size.
    static let placeLabel = TextLook(face: .inter, size: 10, weight: 600, scale: .fixed, color: Color(hex: 0x3C4658))
    static let mapLabel = TextLook(face: .sora, size: 10, weight: 600, scale: .fixed, color: BeaconColors.mapNavy, tracking: 0.7)
}

// Applies a look at the size Dynamic Type asks for. @ScaledMetric gives "how much bigger than default"
// for the look's text style (100 = the default size), and the Figma size is scaled by that.
private struct LookModifier: ViewModifier {
    let look: TextLook
    let color: Color?
    let fontOnly: Bool
    @ScaledMetric private var percent: CGFloat

    init(look: TextLook, color: Color?, fontOnly: Bool) {
        self.look = look
        self.color = color
        self.fontOnly = fontOnly
        _percent = ScaledMetric(wrappedValue: 100, relativeTo: look.scale.textStyle)
    }

    @ViewBuilder
    func body(content: Content) -> some View {
        let size = look.scale == .fixed ? look.size : look.size * percent / 100
        if fontOnly {
            content.font(look.font(size: size)).tracking(look.tracking)
        } else {
            content.font(look.font(size: size)).foregroundStyle(color ?? look.color).tracking(look.tracking).lineSpacing(look.lineSpacing)
        }
    }
}

extension View {
    func style(_ look: TextLook, color: Color? = nil) -> some View {
        modifier(LookModifier(look: look, color: color, fontOnly: false))
    }

    // Only the font (scaled with Dynamic Type), for text fields and buttons that set their own color.
    func beaconFont(_ look: TextLook) -> some View {
        modifier(LookModifier(look: look, color: nil, fontOnly: true))
    }
}
