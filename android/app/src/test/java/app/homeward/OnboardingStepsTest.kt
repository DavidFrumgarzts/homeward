package app.homeward

import app.homeward.features.onboarding.OnboardingStep
import app.homeward.features.onboarding.OnboardingSteps
import org.junit.Assert.*
import org.junit.Test

// Checks onboarding order and that you can't skip adding a contact.
class OnboardingStepsTest {
    @Test fun order() {
        assertEquals(OnboardingStep.Welcome, OnboardingSteps.next(OnboardingStep.Story))
        assertEquals(OnboardingStep.Contacts, OnboardingSteps.next(OnboardingStep.Welcome))
        assertNull(OnboardingSteps.next(OnboardingStep.GetReady))
        assertNull(OnboardingSteps.previous(OnboardingStep.Story))
    }

    @Test fun progressBarSkipsTheStory() {
        assertEquals(0, OnboardingSteps.progressIndex(OnboardingStep.Welcome))
        assertEquals(OnboardingSteps.SETUP_STEPS - 1, OnboardingSteps.progressIndex(OnboardingStep.GetReady))
    }

    @Test fun contactsNeedsAtLeastOne() {
        assertFalse(OnboardingSteps.canContinue(OnboardingStep.Contacts, 0))
        assertTrue(OnboardingSteps.canContinue(OnboardingStep.Contacts, 1))
        assertTrue(OnboardingSteps.canContinue(OnboardingStep.Welcome, 0))
    }
}
