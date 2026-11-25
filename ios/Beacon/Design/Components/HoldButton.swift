import SwiftUI

// A button that only fires after being held for `seconds`, with a fill that grows while you hold,
// so it can't go off in a pocket. Used for "Hold for SOS". With VoiceOver a double tap activates it
// (the hold gesture is not possible there), and the hint says so.
struct HoldButton: View {
    var label: String
    var color: Color = BeaconColors.red
    var seconds: Double = 1.5
    var action: () -> Void

    @State private var progress: CGFloat = 0
    @State private var holding = false

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: BeaconRadius.holdButton, style: .continuous).fill(color)
            GeometryReader { geo in
                Rectangle().fill(Color.black.opacity(0.22)).frame(width: geo.size.width * progress)
            }
            .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.holdButton, style: .continuous))
            Text(holding ? "Keep holding…" : label).style(.heading, color: .white)
                .lineLimit(1).minimumScaleFactor(0.75).padding(.horizontal, 16)
        }
        .frame(height: BeaconSize.holdButton)
        .contentShape(Rectangle())
        .onLongPressGesture(minimumDuration: seconds, maximumDistance: 60, perform: {
            holding = false
            progress = 0
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
            action()
        }, onPressingChanged: { pressing in
            holding = pressing
            if pressing { withAnimation(.linear(duration: seconds)) { progress = 1 } }
            else { withAnimation(.easeOut(duration: 0.2)) { progress = 0 } }
        })
        .accessibilityElement()
        .accessibilityLabel(label)
        .accessibilityHint("Starts an SOS. Double tap to start.")
        .accessibilityAddTraits(.isButton)
        .accessibilityAction { action() }
    }
}
