import SwiftUI

// Beacon's face in the chat: the small cartoon officer (Figma "Character/Beacon cop", the picture in
// docs/design/cop/). He bobs gently, and a little faster while Beacon is working on an answer.
struct BeaconCop: View {
    var lively: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var up = false

    var body: some View {
        Image("beacon_cop").resizable().scaledToFit().frame(width: 72, height: 72)
            .clipShape(Circle())
            .offset(y: up ? -3 : 2)
            .animation(reduceMotion ? nil : .easeInOut(duration: lively ? 0.35 : 1.4).repeatForever(autoreverses: true), value: up)
            .onAppear { up = true }
            .accessibilityLabel("Beacon")
    }
}
