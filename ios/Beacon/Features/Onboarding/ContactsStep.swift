import SwiftUI

// Setup step 2 (Figma "04 Who should hear from you"): her name and at least one trusted person.
// "Continue" stays off until there is one.
struct ContactsStep: View {
    var onNext: () -> Void
    var onBack: () -> Void
    @EnvironmentObject private var store: LocalStore

    var body: some View {
        StepLayout(step: .contacts, title: "Who should hear from you?", button: "Continue",
                   buttonEnabled: OnboardingSteps.canContinue(.contacts, contactCount: store.contacts.count), onBack: onBack, onButton: onNext) {
            ContactsEditor()
            // Optional: let "I'm OK" include where she is. Off by default; an SOS always includes it.
            WhiteCard {
                Toggle(isOn: $store.shareLocationOnCheckIn) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Add my location to \"I'm OK\"").style(.label)
                        Text("Only when you tap it. Beacon shares where you are only in an SOS or a Safe Walk you start.").style(.small).fixedSize(horizontal: false, vertical: true)
                    }
                }
                .tint(BeaconColors.primary)
            }
        }
    }
}

// Who gets the SOS, opened from "Edit" on Home.
struct ContactsScreen: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 4) {
                    Button { dismiss() } label: { Image(systemName: "arrow.left").font(.system(size: 18, weight: .semibold)).foregroundStyle(BeaconColors.text).frame(width: 44, height: 44, alignment: .leading) }
                        .accessibilityLabel("Back")
                    Text("Who gets your SOS").style(.title)
                }
                Text("Only these people see your exact location, and only in an SOS, or in an \"I'm OK\" if you turned that on.").style(.small)
                ContactsEditor()
            }
            .padding(20)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(BeaconColors.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }
}
