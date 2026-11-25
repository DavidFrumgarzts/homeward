import SwiftUI

// The flat white rounded card used for most blocks (feature rows, contacts, answers).
// No shadow: white on the warm background is enough, as in the Figma design.
struct WhiteCard<Content: View>: View {
    var padding: CGFloat = 16
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0, content: content)
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BeaconColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.card, style: .continuous))
    }
}
