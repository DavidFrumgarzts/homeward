import SwiftUI

// The white "Ask Beacon" box with the blue square on the right (Figma "07 Home" and "08 Ask Beacon",
// Android HomeBottomSheet / AskBeaconScreen). `field` is the placeholder text on Home, or the text
// field in the chat. On Home the whole box is one tap target (`wholeBoxTaps`), so VoiceOver reads it
// as one button.
struct AskBox<Field: View>: View {
    var icon: String = "arrow.up"
    var iconLabel: String
    var wholeBoxTaps: Bool = false
    var action: () -> Void
    @ViewBuilder var field: () -> Field

    var body: some View {
        if wholeBoxTaps {
            Button(action: action) { row(square) }
                .buttonStyle(.plain)
                .accessibilityElement(children: .combine)
                .accessibilityAddTraits(.isButton)
        } else {
            row(Button(action: action) { square.contentShape(Rectangle()) }.buttonStyle(.plain).accessibilityLabel(iconLabel))
        }
    }

    private var square: some View {
        Image(systemName: icon).font(.system(size: 18, weight: .semibold)).foregroundStyle(.white)
            .frame(width: BeaconSize.send, height: BeaconSize.send)
            .background(BeaconColors.primary)
            .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.field, style: .continuous))
            .accessibilityHidden(wholeBoxTaps)
    }

    private func row(_ trailing: some View) -> some View {
        HStack(spacing: 12) {
            field().frame(maxWidth: .infinity, alignment: .leading)
            trailing
        }
        .padding(.leading, 18).padding(.trailing, 6).padding(.vertical, 6)
        .frame(minHeight: BeaconSize.askBox)
        .background(BeaconColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.card, style: .continuous))
        .contentShape(RoundedRectangle(cornerRadius: BeaconRadius.card, style: .continuous))
    }
}
