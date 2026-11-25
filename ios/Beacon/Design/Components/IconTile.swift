import SwiftUI

// An outline icon on a soft colored tile with rounded corners (feature rows, permission cards).
// Blue by default; pass a tint and background for the red and amber versions.
struct IconTile: View {
    var systemName: String
    var tint: Color = BeaconColors.primary
    var background: Color = BeaconColors.primaryTint
    var size: CGFloat = BeaconSize.iconTile

    var body: some View {
        Image(systemName: systemName)
            .font(.system(size: size * 0.45, weight: .medium))
            .foregroundStyle(tint)
            .frame(width: size, height: size)
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.tile, style: .continuous))
            .accessibilityHidden(true)
    }
}
