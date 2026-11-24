# features/incident/contracts/
The shared contracts between the three layers. Plain Kotlin, `@Serializable`, no Android types.
- `ActivationMethod.kt`: how a session started (SOS button, tile, widget, safe phrase, ...).
- `LocationFix.kt`: a GPS point with the time it was taken and its accuracy.
- `IncidentInput.kt`: INPUT -> PROCESSING. What the input layer hands over when a session starts.
- `Delivery.kt`: what really happened to a message for one contact (saved, waiting, sent, delivered, failed).
- `IncidentViewState.kt`: PROCESSING -> DISPLAY. The one thing the SOS screens draw, plus the incident phases.

The same shapes are described for iOS and web in `shared/schema/`.
