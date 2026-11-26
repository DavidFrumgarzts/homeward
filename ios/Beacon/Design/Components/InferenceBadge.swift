import SwiftUI

// The small tag on every AI answer that says where it was written: on this iPhone (Apple's model),
// in the cloud (Gemini), or by no AI at all (a plain saved answer). Judges and users can see hybrid
// inference working without reading code.
struct InferenceBadge: View {
    var ranOnDevice: Bool?   // nil = no AI wrote this
    var noAiLabel = "No AI: saved answer"

    var body: some View {
        let (text, icon, tint, back): (String, String, Color, Color) = switch ranOnDevice {
        case .some(true): ("On device", "iphone", BeaconColors.green, BeaconColors.greenTint)
        case .some(false): ("Cloud", "cloud", BeaconColors.primary, BeaconColors.primaryTint)
        case .none: (noAiLabel, "doc.text", BeaconColors.textMuted, BeaconColors.surfaceAlt)
        }
        Label(text, systemImage: icon)
            .beaconFont(.inter(12, 600, .caption))
            .foregroundStyle(tint)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(back)
            .clipShape(Capsule())
            .accessibilityLabel("Written: \(text)")
    }
}
