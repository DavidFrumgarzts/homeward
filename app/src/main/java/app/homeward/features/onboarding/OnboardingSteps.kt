package app.homeward.features.onboarding

// PURE LOGIC: the order of onboarding steps and when "Continue" is allowed. Tested in OnboardingStepsTest.
enum class OnboardingStep { Welcome, Story, Contacts, Permissions, GetReady }

object OnboardingSteps {
    val all = OnboardingStep.entries

    fun next(step: OnboardingStep): OnboardingStep? = all.getOrNull(step.ordinal + 1)
    fun previous(step: OnboardingStep): OnboardingStep? = all.getOrNull(step.ordinal - 1)

    // Contacts needs at least one person: an SOS that goes to nobody is worse than no app.
    fun canContinue(step: OnboardingStep, contactCount: Int): Boolean =
        step != OnboardingStep.Contacts || contactCount > 0
}
