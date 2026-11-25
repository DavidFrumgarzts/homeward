# Features/Onboarding/
First-launch flow, one file per step (Figma "Beacon v2", screens 01 to 06).
- `OnboardingFlow.swift`: runs the steps in order; marks setup done at the end. `OnboardingSteps.swift`: pure logic, the order and the "at least one contact" rule.
- `StepLayout.swift`: shared frame (progress bars, back arrow, title, blue button) and the `FeatureRow` card.
- `StoryStep.swift` + `StoryMap.swift`: one night in Lapa, without and then with Beacon, drawn on the Lapa map.
- `WelcomeStep.swift`: the three features.
- `ContactsStep.swift`: who should hear from you (also `ContactsScreen`, opened from Home). `ContactsEditor.swift`: her name, how to refer to her, the list and the add form. `ContactPicker.swift`: iOS's contact picker (no permission needed).
- `PermissionsStep.swift`: location while using the app; explains that Messages needs no permission.
- `GetReadyStep.swift`: what is saved for offline use, and whether Apple's on-device AI can answer on this iPhone.
