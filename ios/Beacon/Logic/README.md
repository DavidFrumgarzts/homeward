# Logic/
Pure logic: no UIKit, no Firebase, no AI. Each file is a port of the Android file named in its header, and
`ios/BeaconTests` runs the shared cases in `shared/test-vectors/` against it, so iOS, Android and web give the same answers.
- `GeoPoint.swift`: lat/lng, distance, the short coordinate text, the map link (always with a dot, whatever the phone's language).
- `SafetyPack.swift`: the saved city pack (numbers, phrases, places, zones). Unknown fields are ignored, missing ones get defaults.
- `ZoneChecker.swift`: inside a zone? risky at this hour? red zone ahead? `ApproachDetector.swift`: when to buzz.
- `SafePlacePicker.swift`: the nearest open place to get help, with the reason. `NearbyFeed.swift`: "11pm", "250 m".
- `Situation.swift` (what kind of trouble, by key words), `ActionChecklist.swift` (the reviewed steps), `PhrasePicker.swift` (which saved phrase to show a stranger).
- `IncidentMessages.swift`: every text a contact can get. `UserProfile.swift`: her name and how to refer to her. `UpdateThrottle.swift`: when a location update goes out.
- `DeliveryWording.swift`: Android's "sent" wording (kept for the shared vectors). `SosPathWording.swift`: the iOS wording for its two paths, Messages and the live link.
- `AskBeaconPrompt.swift`: the facts handed to the model. `AskBeaconRules.swift`: answers with no AI at all.
- `CheckInMessage.swift`, `PhoneNumber.swift` (also `Names.join`), `TrustedContact.swift`, `LapaMapProjection.swift` (also `Heading`).
- `Incident/`: the contracts and the state machine.
