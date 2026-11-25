import Foundation

// PURE LOGIC: the order of the setup steps and when "Continue" is allowed.
// Story comes first: the night in Rio that Beacon is built for, before any setup.
// Same order as Android's OnboardingSteps.kt. Tested in OnboardingStepsTests.
enum OnboardingStep: Int, CaseIterable, Sendable {
    case story, welcome, contacts, permissions, getReady
}

enum OnboardingSteps {
    static func next(_ step: OnboardingStep) -> OnboardingStep? { OnboardingStep(rawValue: step.rawValue + 1) }
    static func previous(_ step: OnboardingStep) -> OnboardingStep? { OnboardingStep(rawValue: step.rawValue - 1) }

    // Contacts needs at least one person: an SOS that goes to nobody is worse than no app.
    static func canContinue(_ step: OnboardingStep, contactCount: Int) -> Bool { step != .contacts || contactCount > 0 }

    // The progress bars count only the setup steps (the story has none).
    static let setupSteps = 4
    static func progressIndex(_ step: OnboardingStep) -> Int { step.rawValue - 1 }
}
