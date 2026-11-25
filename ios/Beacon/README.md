# ios/Beacon

The iPhone app. One folder per layer; every folder has its own README listing its files.

| Folder | What is in it |
|---|---|
| `App/` | Starts the app, creates the shared services, decides which screen shows |
| `AI/` | The only place AI models are created (Firebase AI Logic, hybrid: on the iPhone first, cloud as fallback) |
| `Design/` | Colors, fonts and the small shared UI pieces (same look as Android and Figma "Beacon v2") |
| `Logic/` | Pure logic, no UIKit and no AI: zones, place picker, messages, the incident state machine. Ported from Android's Kotlin and checked by the shared test vectors |
| `Services/` | Phone and network: stores, GPS, Firebase setup, Firestore sync, and the incident engine that runs the state machine |
| `Features/` | The screens, one folder per feature |

`Info.plist` only registers the two fonts; everything else (name, usage strings) is in the target's build settings.
`GoogleService-Info.plist` is the Firebase config: download it from the console, keep it here, never commit it.
`Assets.xcassets` holds the app icon and copies of the map pictures (`sh ios/scripts/sync-landmarks.sh` refreshes them).
