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
            Text(label).style(.label, color: .white)
                .frame(maxWidth: .infinity).frame(height: height)
                .background(enabled ? color : BeaconColors.border)
                .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.button, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
    }
}
