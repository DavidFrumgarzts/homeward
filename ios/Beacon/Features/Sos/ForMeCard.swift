import SwiftUI

// The "For me" block: what to do right now, in the order of Figma "09 SOS sent": the big red call
// to the pack's number, the nearest open place to get help (an outlined card), then the reviewed
// steps for her situation (the first three, the rest behind "More steps"). Nothing here is written by AI.
struct ForMeCard: View {
    var view: IncidentViewState
    var onCall: () -> Void
    @State private var showAll = false

    var body: some View {
        VStack(spacing: 16) {
            PrimaryButton(label: "Call \(view.emergencyLabel) \(view.emergencyNumber)", color: BeaconColors.red, height: BeaconSize.holdButton, action: onCall)
            if let pick = view.suggestedPlace {
                HStack(spacing: 14) {
                    PlaceBadge(kind: pick.place.kind, size: 32)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Walk to \(pick.place.name)").style(.label).lineLimit(1)
                        Text("\(NearbyFeed.distance(pick.meters)), \(pick.place.open24h ? "open 24 hours" : "open now")").style(.small)
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
                        Button("More steps") { showAll = true }.font(TextLook.label.font).foregroundStyle(BeaconColors.primary).frame(minHeight: 44)
                    }
                }
            }
        }
    }
}
