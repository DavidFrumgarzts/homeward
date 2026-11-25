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
            RoundedRectangle(cornerRadius: 20, style: .continuous).fill(color)
            GeometryReader { geo in
                Rectangle().fill(Color.black.opacity(0.22)).frame(width: geo.size.width * progress)
            }
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            Text(label).style(.heading, color: .white)
        }
        .frame(height: 64)
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
