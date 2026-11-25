import SwiftUI

// The "For me" card: what to do right now. Reviewed steps for her situation (the first three, the
// rest behind "More steps"), then the one-tap call to the pack's number and the nearest open place
// to get help. Nothing on this card is written by AI.
struct ForMeCard: View {
    var view: IncidentViewState
    var onCall: () -> Void
    @State private var showAll = false

    var body: some View {
        VStack(spacing: 12) {
            WhiteCard {
                Text("For you, now").style(.label)
                ForEach(Array((showAll ? view.forMe : Array(view.forMe.prefix(3))).enumerated()), id: \.offset) { index, step in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(index + 1)").font(BeaconFonts.inter(13, weight: 600)).foregroundStyle(BeaconColors.primary)
                            .frame(width: 26, height: 26).background(BeaconColors.primaryTint).clipShape(Circle())
                        Text(step).style(.body).fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.top, 10)
                }
                if view.forMe.count > 3 && !showAll {
                    Button("More steps") { showAll = true }.font(TextLook.small.font).foregroundStyle(BeaconColors.primary).frame(minHeight: 44)
                }
            }
            PrimaryButton(label: "Call \(view.emergencyLabel) \(view.emergencyNumber)", color: BeaconColors.red, height: 64, action: onCall)
            if let pick = view.suggestedPlace {
                HStack(spacing: 12) {
                    PlaceBadge(kind: pick.place.kind, size: 32)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Walk to \(pick.place.name)").style(.label).lineLimit(1)
                        Text("\(NearbyFeed.distance(pick.meters)), \(pick.place.open24h ? "open 24 hours" : "open now")").style(.small)
                    }
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 16).padding(.vertical, 14)
                .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(BeaconColors.border, lineWidth: 1.5))
                .accessibilityElement(children: .combine)
            }
        }
    }
}
