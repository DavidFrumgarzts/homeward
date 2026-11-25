import SwiftUI

// The sheet at the bottom of Home (Figma "07 Home"), top to bottom: Ask Beacon box, two ready-made
// questions, the nearest open place to get help, I'm OK + Police, and Hold for SOS.
struct HomeSheet: View {
    var pack: SafetyPack
    var contactNames: String
    var place: SafePlacePicker.Pick?
    var onAsk: (String) -> Void      // "" opens Ask Beacon empty; a ready-made question asks it right away
    var onPlace: () -> Void
    var onImOk: () -> Void
    var onPolice: () -> Void
    var onSos: () -> Void
    var onEditContacts: () -> Void

    var body: some View {
        VStack(spacing: BeaconSpacing.stack) {
            Capsule().fill(BeaconColors.border).frame(width: 40, height: 5)

            AskBox(icon: "arrow.right", iconLabel: "Ask Beacon", wholeBoxTaps: true, action: { onAsk("") }) {
                Text("Ask Beacon anything").style(.body, color: BeaconColors.textMuted)
            }

            QuickPickChips(options: ["Is this area OK now?", "Where can I get help?"], onPick: onAsk).frame(maxWidth: .infinity, alignment: .leading)

            if let place {
                Button(action: onPlace) {
                    WhiteCard(padding: 14) {
                        HStack(spacing: 12) {
                            PlaceBadge(kind: place.place.kind, size: 30).frame(width: 44, height: 44).background(BeaconColors.surfaceAlt).clipShape(RoundedRectangle(cornerRadius: BeaconRadius.smallTile, style: .continuous))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(place.place.name) · \(NearbyFeed.distance(place.meters))").style(.label).lineLimit(1)
                                Text(place.place.open24h ? "Open 24 hours" : "Open now").style(.small)
                            }
                            Spacer(minLength: 0)
                        }
                    }
                }
                .buttonStyle(.plain)
                .accessibilityElement(children: .combine)
                .accessibilityHint("Shows why this place")
            }

            HStack(spacing: BeaconSpacing.cards) {
                quick("I'm OK", "checkmark", BeaconColors.green, onImOk)
                quick("Police \(pack.police)", "phone", BeaconColors.red, onPolice)
            }

            // SOS: the biggest thing on the sheet, and the only red one.
            HoldButton(label: "Hold for SOS · works with no signal", action: onSos)

            // Who gets the SOS, with a way to change it.
            Button(action: onEditContacts) {
                HStack {
                    Text(contactNames.isEmpty ? "No one gets your SOS yet" : "Goes to \(contactNames)").style(.small).lineLimit(1)
                    Spacer()
                    Text(contactNames.isEmpty ? "Add" : "Edit").style(.small, color: BeaconColors.primary)
                }
                .frame(minHeight: 32)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, BeaconSpacing.sheet).padding(.top, 12).padding(.bottom, 8)
        .background(BeaconColors.background.clipShape(UnevenRoundedRectangle(topLeadingRadius: BeaconRadius.sheet, topTrailingRadius: BeaconRadius.sheet, style: .continuous)).ignoresSafeArea(edges: .bottom))
    }

    private func quick(_ label: String, _ icon: String, _ tint: Color, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon).font(.system(size: 18, weight: .semibold)).foregroundStyle(tint).accessibilityHidden(true)
                Text(label).style(.label).lineLimit(1).minimumScaleFactor(0.85)
            }
            .frame(maxWidth: .infinity, minHeight: BeaconSize.quickAction)
            .background(BeaconColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.button, style: .continuous))
            .contentShape(RoundedRectangle(cornerRadius: BeaconRadius.button, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
