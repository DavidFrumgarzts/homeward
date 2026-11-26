import SwiftUI

// The plain back arrow at the top left of a screen (setup steps, Ask Beacon, Contacts, SOS compose).
struct BackButton: View {
    var label: String = "Back"
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: "arrow.left").font(.system(size: 18, weight: .semibold)).foregroundStyle(BeaconColors.text)
                .frame(width: BeaconSize.minTap, height: BeaconSize.minTap, alignment: .leading)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}
