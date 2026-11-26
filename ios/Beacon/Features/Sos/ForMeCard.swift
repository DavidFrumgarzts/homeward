import SwiftUI

// The "For me" block: what to do right now, in the order of Figma "09 SOS sent": the big red call
// to the pack's number, the nearest open place to get help (an outlined card), then the reviewed
// steps for her situation (the first three, the rest behind "More steps"). Nothing here is written by AI.
struct ForMeCard: View {
    var view: IncidentViewState
    var onCall: () -> Void
    @State private var showAll = false
    @State private var wouldCall: String?   // test mode: the number that would have been dialed

    var body: some View {
        VStack(spacing: 16) {
            // In test mode nothing is dialed: the number is shown instead (TestMode.swift).
            PrimaryButton(label: "Call \(view.emergencyLabel) \(view.emergencyNumber)", color: BeaconColors.red, height: BeaconSize.holdButton) {
                if view.testMode { wouldCall = view.emergencyNumber } else { onCall() }
            }
            .accessibilityHint(view.testMode ? "Test mode: shows the number instead of calling" : "Opens the phone to call \(view.emergencyNumber)")
            if let pick = view.suggestedPlace {
                HStack(spacing: 14) {
                    PlaceBadge(kind: pick.place.kind, size: 32)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Walk to \(pick.place.name)").style(.label).lineLimit(1)
                        Text("\(NearbyFeed.distance(pick.meters)), \(pick.place.open24h ? "open 24 hours" : "open now")").style(.small).monospacedDigit()
                    }
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 18).padding(.vertical, 16)
                .overlay(RoundedRectangle(cornerRadius: BeaconRadius.holdButton, style: .continuous).stroke(BeaconColors.border, lineWidth: 1.5))
                .accessibilityElement(children: .combine)
            }
            if !view.forMe.isEmpty {
                WhiteCard(padding: 18) {
                    Text("For you, now").style(.heading)
                    ForEach(Array((showAll ? view.forMe : Array(view.forMe.prefix(3))).enumerated()), id: \.offset) { index, step in
                        NumberedStep(number: index + 1, text: step).padding(.top, 12)
                    }
                    if view.forMe.count > 3 && !showAll {
                        Button("More steps") { showAll = true }.beaconFont(.label).foregroundStyle(BeaconColors.primary).frame(minHeight: 44)
                    }
                }
            }
        }
        .alert("Test mode", isPresented: Binding(get: { wouldCall != nil }, set: { if !$0 { wouldCall = nil } })) {
            Button("OK") { wouldCall = nil }
        } message: {
            Text(TestMode.wouldCall(wouldCall ?? ""))
        }
    }
}
