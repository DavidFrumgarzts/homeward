package app.homeward.features.onboarding

// PURE LOGIC: the order of onboarding steps and when "Continue" is allowed. Tested in OnboardingStepsTest.
// Story comes first: the night in Rio that Beacon is built for, before any setup.
enum class OnboardingStep { Story, Welcome, Contacts, Permissions, GetReady }

object OnboardingSteps {
    val all = OnboardingStep.entries

    fun next(step: OnboardingStep): OnboardingStep? = all.getOrNull(step.ordinal + 1)
    fun previous(step: OnboardingStep): OnboardingStep? = all.getOrNull(step.ordinal - 1)

    // Contacts needs at least one person: an SOS that goes to nobody is worse than no app.
    fun canContinue(step: OnboardingStep, contactCount: Int): Boolean =
        step != OnboardingStep.Contacts || contactCount > 0

    // The progress bar counts only the setup steps (the story has no bar).
    const val SETUP_STEPS = 4
    fun progressIndex(step: OnboardingStep): Int = step.ordinal - 1
}
