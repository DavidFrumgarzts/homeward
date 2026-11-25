import SwiftUI

// Setup step 4 (Figma "06 Ready offline"): what is saved on the phone for when there is no signal:
// the red zones, places to get help and the city's numbers (the safety pack), and whether Apple's
// on-device AI can answer here. In this phase the pack is the one that ships with the app.
struct GetReadyStep: View {
    var onDone: () -> Void
    var onBack: () -> Void
    @EnvironmentObject private var packs: PackStore
    @State private var ai = AiModels.onDevice

    var body: some View {
        let pack = packs.pack
        let risky = pack.zones.filter { $0.level != .safer }
        StepLayout(step: .getReady, title: "Getting \(pack.city) ready for when you're offline", button: "Start exploring \(pack.city)", onBack: onBack, onButton: onDone) {
            VStack(spacing: BeaconSpacing.cards) {
                FeatureRow(icon: "exclamationmark.triangle", tint: BeaconColors.red, tile: BeaconColors.redTint, title: "\(risky.count) red \(risky.count == 1 ? "zone" : "zones") mapped", detail: risky.map(\.name).joined(separator: ", "), trailing: "DONE")
                FeatureRow(icon: "mappin.circle", title: "\(pack.safePlaces.count) places to get help saved", detail: "Police, hospitals, pharmacies", trailing: "DONE")
                FeatureRow(icon: "book", tint: BeaconColors.amber, tile: BeaconColors.amberTint, title: "\(pack.city) safety pack", detail: "Police \(pack.police), ambulance \(pack.ambulance), embassy, key phrases", trailing: "DONE")
                FeatureRow(icon: "cpu", title: "AI for your iPhone", detail: ai.line, trailing: ai == .ready ? "DONE" : ai.done ? "OK" : "…", trailingColor: ai == .ready ? BeaconColors.green : BeaconColors.primary)
            }
            // Figma "06": one bar under the list for how much is ready (the AI counts once it is no longer downloading).
            ReadyBar(fraction: ai.done ? 1 : 0.75)
            if ai != .ready {
                Text(ai == .simulator
                     ? "On a real iPhone with Apple Intelligence, answers are written on the phone and work with no signal. The map, red-zone warnings, the SOS and saved answers need no AI."
                     : "Beacon still works without it: the map, red-zone warnings, the SOS and saved answers need no AI. With a connection, answers are written in the cloud.").style(.small).fixedSize(horizontal: false, vertical: true)
            }
            if packs.isBundledDemo {
                Text("This is the pack that comes with the app. Packs for other cities arrive with the trip planner.").style(.small).fixedSize(horizontal: false, vertical: true)
            }
        }
        .onAppear { ai = AiModels.onDevice }
    }
}

// The thin bar under the list: blue for what is ready, the soft line color for the rest.
private struct ReadyBar: View {
    var fraction: CGFloat

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(BeaconColors.border)
                Capsule().fill(BeaconColors.primary).frame(width: geo.size.width * fraction)
            }
        }
        .frame(height: 6)
        .accessibilityElement()
        .accessibilityLabel(fraction >= 1 ? "Everything is ready" : "Almost ready")
    }
}
