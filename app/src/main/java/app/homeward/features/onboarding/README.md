# features/onboarding/
First-launch flow, one file per step. Matches the Figma section "Homeward – onboarding".
- `OnboardingFlow.kt`: runs the steps in order, back goes one step back, marks done at the end.
- `OnboardingSteps.kt`: pure logic. Step order; "Continue" needs at least one contact.
- `OnboardingStore.kt`: remembers it is done (shown only once).
- `StepLayout.kt`: shared frame (progress dots, title, text, red button).
- `WelcomeStep.kt` (landing) -> `ContactsStep.kt` -> `PermissionsStep.kt` (location + SMS) -> `GetReadyStep.kt` (safety pack, real safe places, on-device AI, with live status).
