import SwiftUI

// Onboarding progress (Figma "Progress/Steps"): equal bars across the top, blue up to the current step.
struct ProgressBars: View {
    var current: Int
    var total: Int

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<total, id: \.self) { i in
                RoundedRectangle(cornerRadius: 2).fill(i <= current ? BeaconColors.primary : BeaconColors.border).frame(height: 4)
            }
        }
        .accessibilityElement()
        .accessibilityLabel("Step \(current + 1) of \(total)")
    }
}
