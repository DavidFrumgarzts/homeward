import SwiftUI

// A button that only fires after being held for `seconds`, with a fill that grows while you hold,
// so it can't go off in a pocket. Used for "Hold for SOS". With VoiceOver a double tap activates it
// (the hold gesture is not possible there), and the hint says so.
// Haptics: a light tap when the hold starts, a firm one halfway, a warning buzz when it fires.
struct HoldButton: View {
    var label: String
    var color: Color = BeaconColors.red
    var seconds: Double = 1.5
    var voiceOverLabel: String? = nil
    var voiceOverHint: String = "Starts an SOS. Double tap to start."
    var action: () -> Void

    @State private var progress: CGFloat = 0
    @State private var holding = false
    @State private var halfway = 0
    @State private var fired = 0
    @State private var halfwayTimer: Task<Void, Never>?
    // Grows a little with larger text, but stays a button, not a wall.
    @ScaledMetric(relativeTo: .headline) private var height: CGFloat = BeaconSize.holdButton

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: BeaconRadius.holdButton, style: .continuous).fill(color)
            GeometryReader { geo in
                Rectangle().fill(Color.black.opacity(0.22)).frame(width: geo.size.width * progress)
            }
            .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.holdButton, style: .continuous))
            // Always one line: at large text sizes it shrinks instead of wrapping or clipping.
            Text(holding ? "Keep holding…" : label).style(.heading, color: .white)
                .lineLimit(1).minimumScaleFactor(0.5).allowsTightening(true).padding(.horizontal, 16)
        }
        .frame(height: min(max(height, BeaconSize.holdButton), BeaconSize.holdButton * 1.4))
        .contentShape(RoundedRectangle(cornerRadius: BeaconRadius.holdButton, style: .continuous))
        .onLongPressGesture(minimumDuration: seconds, maximumDistance: 60, perform: {
            holding = false
            progress = 0
            fire()
        }, onPressingChanged: { pressing in
            holding = pressing
            halfwayTimer?.cancel()
            if pressing {
                withAnimation(.linear(duration: seconds)) { progress = 1 }
                let wait = UInt64(seconds / 2 * 1_000_000_000)
                halfwayTimer = Task { @MainActor in
                    try? await Task.sleep(nanoseconds: wait)
                    if !Task.isCancelled && holding { halfway += 1 }
                }
            } else {
                withAnimation(.easeOut(duration: 0.2)) { progress = 0 }
            }
        })
        .sensoryFeedback(.impact(weight: .light), trigger: holding) { _, now in now }
        .sensoryFeedback(.impact(weight: .medium), trigger: halfway)
        .sensoryFeedback(.warning, trigger: fired)
        .accessibilityElement()
        .accessibilityLabel(voiceOverLabel ?? label)
        .accessibilityHint(voiceOverHint)
        .accessibilityAddTraits(.isButton)
        .accessibilityAction { fire() }
    }

    private func fire() {
        fired += 1
        action()
    }
}
