# features/onboarding/
First-launch flow, one file per step. Matches the Figma page "Beacon v2" (screens 01 to 06).
- `OnboardingFlow.kt`: runs the steps in order, back goes one step back, marks done at the end.
- `OnboardingSteps.kt`: pure logic. Step order; "Continue" needs at least one contact; the progress bar skips the story.
- `OnboardingStore.kt`: remembers it is done (shown only once).
- `StepLayout.kt`: shared frame for the setup steps (progress bars, title, text, blue button).
- `StoryStep.kt` (one night in Lapa, without and then with Beacon) + `StoryMap.kt` (the Home map with the walk drawing itself on top)
  -> `WelcomeStep.kt` (the three features) -> `ContactsStep.kt` (her name, contacts, + location on "I'm OK") -> `PermissionsStep.kt` (location, SMS, notifications)
  -> `GetReadyStep.kt` (red zones, places to get help, safety pack, on-device AI, with live status).
