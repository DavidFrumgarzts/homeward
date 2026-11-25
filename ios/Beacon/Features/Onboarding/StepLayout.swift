import SwiftUI

// Shared frame for every setup step: progress bars, optional back arrow and picture, title, content, and one
// blue button at the bottom. No subheadline: the title says it.
struct StepLayout<Content: View>: View {
    var step: OnboardingStep
    var title: String
    var button: String
    var buttonEnabled: Bool = true
    var onBack: (() -> Void)? = nil
    var header: AnyView? = nil          // shown above the title (the picture on Welcome)
    var onButton: () -> Void
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 12) {
                if let onBack {
                    Button(action: onBack) { Image(systemName: "arrow.left").font(.system(size: 18, weight: .semibold)).foregroundStyle(BeaconColors.text).frame(width: 44, height: 44, alignment: .leading) }
                        .accessibilityLabel("Back")
                }
                ProgressBars(current: OnboardingSteps.progressIndex(step), total: OnboardingSteps.setupSteps)
            }
            .frame(minHeight: 44)
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let header { header }
                    Text(title).style(.title).fixedSize(horizontal: false, vertical: true)
                    content()
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 20).padding(.bottom, 16)
            }
            .scrollIndicators(.hidden)
            .scrollDismissesKeyboard(.interactively)
            PrimaryButton(label: button, enabled: buttonEnabled, action: onButton)
        }
        .padding(.horizontal, 24).padding(.top, 8).padding(.bottom, 16)
        .background(BeaconColors.background.ignoresSafeArea())
    }
}

// One row used on several steps: a colored icon tile, a title and a line of detail, on a white card.
struct FeatureRow: View {
    var icon: String
    var tint: Color = BeaconColors.primary
    var tile: Color = BeaconColors.primaryTint
    var title: String
    var detail: String
    var trailing: String? = nil
    var trailingColor: Color = BeaconColors.green

    var body: some View {
        WhiteCard(padding: 14) {
            HStack(spacing: 14) {
                IconTile(systemName: icon, tint: tint, background: tile)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).style(.label)
                    Text(detail).style(.small).fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
                if let trailing { Text(trailing).style(.mapLabel, color: trailingColor) }
            }
        }
        .accessibilityElement(children: .combine)
    }
}
