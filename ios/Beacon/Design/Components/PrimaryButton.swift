import SwiftUI

// Full-width button for the one main action on a screen (Figma "Button/Primary"). Blue by default;
// pass color: BeaconColors.red only for emergency actions (send SOS, call police).
struct PrimaryButton: View {
    var label: String
    var color: Color = BeaconColors.primary
    var enabled: Bool = true
    var height: CGFloat = BeaconSize.button
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            // At the default text size this is exactly `height` tall; with larger text it grows
            // (and wraps onto a second line) instead of clipping the label.
            Text(label).style(.label, color: .white)
                .multilineTextAlignment(.center).lineLimit(2).minimumScaleFactor(0.8)
                .padding(.horizontal, 16).padding(.vertical, 10)
                .frame(maxWidth: .infinity).frame(minHeight: height)
                .background(enabled ? color : BeaconColors.border)
                .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.button, style: .continuous))
                .contentShape(RoundedRectangle(cornerRadius: BeaconRadius.button, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
    }
}
