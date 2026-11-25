import SwiftUI

// Runs the setup steps in order, then marks setup done. Each step has a back arrow to the one before.
struct OnboardingFlow: View {
    @EnvironmentObject private var store: LocalStore
    @State private var step: OnboardingStep = .story

    var body: some View {
        Group {
            switch step {
            case .story: StoryStep(onNext: next)
            case .welcome: WelcomeStep(onNext: next)
            case .contacts: ContactsStep(onNext: next, onBack: back)
            case .permissions: PermissionsStep(onNext: next, onBack: back)
            case .getReady: GetReadyStep(onDone: { store.onboardingDone = true }, onBack: back)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: step)
    }

    private func next() { if let next = OnboardingSteps.next(step) { step = next } }
    private func back() { if let previous = OnboardingSteps.previous(step) { step = previous } }
}
