import SwiftUI

// One numbered step: the number on a light blue circle, then the text (Figma "08 Ask Beacon" answer
// card, and the "For you, now" steps during an SOS).
struct NumberedStep: View {
    var number: Int
    var text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)").font(BeaconFonts.inter(14, weight: 600)).foregroundStyle(BeaconColors.primary)
                .frame(width: 26, height: 26).background(BeaconColors.primaryTint).clipShape(Circle())
                .accessibilityHidden(true)
            Text(text).style(.body).fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Step \(number): \(text)")
    }
}
