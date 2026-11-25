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
        VStack(spacing: 14) {
            Capsule().fill(BeaconColors.border).frame(width: 40, height: 5)

            Button { onAsk("") } label: {
                HStack {
                    Text("Ask Beacon anything").style(.body, color: BeaconColors.textMuted)
                    Spacer()
                    Image(systemName: "arrow.right").font(.system(size: 18, weight: .semibold)).foregroundStyle(.white)
                        .frame(width: 48, height: 48).background(BeaconColors.primary).clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .padding(.leading, 18).padding(.trailing, 6).padding(.vertical, 6)
                .background(BeaconColors.surface).clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            }
            .buttonStyle(.plain)

            QuickPickChips(options: ["Is this area OK now?", "Where can I get help?"], onPick: onAsk).frame(maxWidth: .infinity, alignment: .leading)

            if let place {
                Button(action: onPlace) {
                    WhiteCard(padding: 14) {
                        HStack(spacing: 12) {
                            PlaceBadge(kind: place.place.kind, size: 30).frame(width: 40, height: 40).background(BeaconColors.mapPaper).clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(place.place.name) · \(NearbyFeed.distance(place.meters))").style(.label).lineLimit(1)
                                Text(place.place.open24h ? "Open 24 hours" : "Open now").style(.small)
                            }
                        }
                    }
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 10) {
                quick("I'm OK", "checkmark", BeaconColors.green, onImOk)
                quick("Police \(pack.police)", "phone", BeaconColors.red, onPolice)
            }

            // SOS: the biggest thing on the sheet, and the only red one.
            HoldButton(label: "Hold for SOS", action: onSos)

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
        .padding(.horizontal, 20).padding(.top, 12).padding(.bottom, 8)
        .background(BeaconColors.background.clipShape(UnevenRoundedRectangle(topLeadingRadius: 30, topTrailingRadius: 30, style: .continuous)).ignoresSafeArea(edges: .bottom))
    }

    private func quick(_ label: String, _ icon: String, _ tint: Color, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label { Text(label).style(.label) } icon: { Image(systemName: icon).foregroundStyle(tint) }
                .frame(maxWidth: .infinity, minHeight: 52).background(BeaconColors.surface).clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
