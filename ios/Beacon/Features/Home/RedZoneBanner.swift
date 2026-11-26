import SwiftUI

// The alert at the top of the map: "Red zone in 250 m". Only shown when one is close and risky at
// this hour. Tap it for the reasons and the nearest open place to get help.
struct RedZoneBanner: View {
    var zone: SafetyZone
    var meters: Int
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle").font(.system(size: 18, weight: .semibold)).foregroundStyle(.white)
                    .frame(width: 40, height: 40).background(BeaconColors.red).clipShape(RoundedRectangle(cornerRadius: BeaconRadius.smallTile, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(meters == 0 ? "You're in a red zone" : "Red zone in \(meters) m").style(.label).monospacedDigit()
                    Text("\(zone.name) · risky from \(NearbyFeed.clock(zone.riskyFromHour)) to \(NearbyFeed.clock(zone.riskyToHour))").style(.small).lineLimit(2).monospacedDigit()
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").foregroundStyle(BeaconColors.textMuted).accessibilityHidden(true)
            }
            .padding(12).background(BeaconColors.surface).clipShape(RoundedRectangle(cornerRadius: BeaconRadius.card, style: .continuous))
            .shadow(color: .black.opacity(0.12), radius: 10, y: 4)
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityHint("Shows why, and where to go instead")
    }
}
