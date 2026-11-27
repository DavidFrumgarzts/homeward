# Architecture map

Find the file for any feature without reading the whole app. Beacon is three native apps on one Firebase project:

| Platform | Folder | Stack |
|---|---|---|
| Android | `android/` (Gradle project; code in `android/app/src/main/java/app/homeward/`) | Kotlin, Jetpack Compose, `firebase-ai` + `firebase-ai-ondevice` |
| iOS | `ios/` | Swift, SwiftUI, Firebase Apple SDK through Swift Package Manager |
| Web (desktop Chrome) | `web/` | Plain HTML, CSS and JavaScript modules, no build step |
| Shared | `shared/` | Data shapes, the demo pack, test vectors, prompts. They share data and behaviour, not UI code |
| Backend | `backend/` (`backend/firebase/`, `backend/functions/`) | Server-side code all three apps use: Firestore rules and indexes, Cloud Functions (texts). Hosting config is `firebase.json` at the repo root |

Every folder has its own README listing its files. The package name is still `app.homeward`; the app is called Beacon.

## One pipeline, three layers (Android)

| Layer | What it does | Where |
|---|---|---|
| **Input** | How a safety session starts and what it captures. Produces an `IncidentInput` and nothing else | Hold for SOS on Home (`design/components/HoldButton.kt`, `navigation/AppNavGraph.kt`). The tile, widget, Safe Walk and listening arrive in Phase 4 |
| **Processing** | The incident state machine and everything an SOS does | `features/incident/` (engine, reducer, messages, update throttle), `features/sos/sending/` (outbox, SMS), `features/session/` (foreground service) |
| **Display** | Screens. They only draw `IncidentViewState` and call a few intents | `features/sos/` (compose and sent screens), `features/home/` |

The layers talk only through the contracts in `features/incident/contracts/`. The same shapes are written down for iOS and web in `shared/schema/`.

`Inactive -> SafetyCheckRequested -> SosActive -> Resolved`, and `Inactive -> SosActive` for confirmed triggers. The transitions are one pure function, `IncidentReducer.reduce(state, event, time)`.

## How hybrid AI is split

| Job | Where it runs | File |
|---|---|---|
| Research a new city (numbers, embassy, zones) | **Cloud** (Gemini + Google Search) | `features/safetypack/SafetyPackBuilder.kt` |
| Rewrite her words into the SOS sentence | **On device** (Gemini Nano), cloud fallback, plain template if both fail | `features/sos/SosMessageWriter.kt`, `SosPrompt.kt` |
| Ask Beacon: answer a question from the saved pack | **On device**, cloud fallback | `features/ask/AskBeacon.kt`, `AskBeaconPrompt.kt` |
| Read a safety photo (taxi plate) | **On device** | `features/safetyphoto/SafetyPhotoReader.kt` |
| Explain a red zone | **On device** | `features/safetymap/ZoneWarningWriter.kt` |
| The incident state machine, when to send updates, which checklist, which phrase, delivery wording | **No AI**, plain logic, offline | `features/incident/` |
| Research travel scams and fair prices for the pack (Reddit threads, forums, advisories) | **Cloud** (Gemini + Google Search) | `features/scancheck/ScamResearcher.kt`, `ScamResearchPrompt.kt` |
| Scan check: read a photo of a board, meter, ticket or price | **On device**, cloud only after she agrees | `features/scancheck/ScanReader.kt` |
| Scan check: Looks fair / Be careful / Walk away | **No AI**, numbers compared with the pack | `features/scancheck/ScanJudge.kt` |
| Red zone ahead? Buzz now? Nearest open safe place? Push or SMS? | **No AI**, plain logic, offline | `ZoneChecker.kt`, `ApproachDetector.kt`, `SafePlacePicker.kt`, `ChannelChooser.kt` |
| Map of the city | Downloaded once on wifi, then offline | `features/offlinemap/` |
| Real places to get help (police, hospitals, pharmacies, gas stations) | OpenStreetMap, downloaded on wifi | `features/osmplaces/` |

AI models are created in one place: `ai/AiModels.kt`. Every AI-written text carries an "On device", "Cloud" or "No AI" badge taken from the SDK's `inferenceSource` (`design/components/InferenceBadge.kt`).

## An SOS, step by step

1. She holds "Hold for SOS" on Home for 1.5 s. `IncidentEngine.startSos()` moves to `SosActive`, starts `SafetySessionService` (GPS every 5 s) and puts a plain, usable message in the draft at once.
2. `SosComposeScreen`: she types, speaks or taps a quick pick. After a pause the hybrid model rewrites her words into one sentence. `IncidentMessages` adds the facts around it by code: location, time, map link, what to do. She can edit everything.
3. Send: `SosDispatcher` puts one text per contact in `SosOutbox` (a file), and `OutboxFlusher` hands them to `SmsSender` when there is cell signal. `SmsStatusReceiver` hears from the radio whether each text was sent and delivered.
4. `SosSentScreen` shows what is really true: "Saved on your phone", "Sent to Mom", and "Mom knows" only once delivered. Below: the reviewed steps for her situation, the call button, the nearest open place, a phrase to show someone nearby.
5. While the SOS is active, `UpdateThrottle` decides when contacts get a location update (200 m or 5 minutes, at most one per 2 minutes, one catch-up text after a stretch with no signal).
6. "I'm safe now, end SOS" asks once, tells contacts it is over, and stops GPS.

Everything sent to contacts is also mirrored to Firestore by `features/sync/IncidentSync.kt` (trip, share, incident, one update per message), and the alert carries a family link (`https://homeward-6999c.web.app/f/{shareId}`) that opens the live web view. Nothing is written before she presses Send. The document shapes and the access rules are in `shared/schema/README.md` and `backend/firebase/firestore.rules`.

## Rules the code follows

- The on-device AI only rewrites or classifies text it is given. Phone numbers, places, phrases, coordinates and links come from the saved pack or from code, never from model output. Every AI call has a non-AI fallback.
- She sees and can edit any AI-written message before it is sent. The one exception is the automatic alert after an unanswered urgent safety check, which uses a fixed template and no AI.
- Exact location goes only to trusted contacts: during an active SOS, or in an "I'm OK" message when she turned that on. In the background, location is read only while a session she started is running.
- "Sent" and "Delivered" are said only when the radio confirmed them.
- Zones describe places and times, never people. Places are "places to get help", not a guarantee of safety.
- Pure logic lives in its own file with a unit test, takes time and location as parameters, and is also run against `shared/test-vectors/` so iOS and web give the same answers.

## Where to fix common bugs

| Symptom | Look in |
|---|---|
| SOS moves to the wrong state, or an update is sent at the wrong time | `features/incident/IncidentReducer.kt`, `UpdateThrottle.kt` (+ their tests) |
| SOS text is wrong | `features/incident/IncidentMessages.kt` (the facts), `features/sos/SosPrompt.kt` (the AI sentence) |
| "Sent" / "Delivered" never shows, or shows too early | `features/sos/sending/SmsStatusReceiver.kt`, `OutboxFlusher.kt`, `features/sos/DeliveryWording.kt` |
| SMS not sent | `features/sos/sending/SmsSender.kt` (SEND_SMS permission), `device/SignalChecker.kt` |
| No location updates during an SOS | `features/session/SafetySessionService.kt` (location permission), `device/LocationUpdates.kt` |
| Family link missing from the SMS | The phone has never signed in (it needs to be online once): `features/sync/FirestoreCloud.kt`, logcat tag `FirestoreCloud` |
| Family view shows nothing | Logcat tag `FirestoreCloud` ("was refused" = the Firestore rules); the SOS screen says "Live link is not updating" |
| No real SMS in a debug build | "Test mode" is on: `android/app/src/debug/java/app/homeward/testmode/` |
| Red zone warning wrong | `features/safetymap/ZoneChecker.kt` (+ `ZoneCheckerTest`) |
| No buzz near a red zone | `features/safetymap/ApproachDetector.kt` (+ test), location permission |
| Pack fails to build | `features/safetypack/SafetyPackBuilder.kt` (JSON parsing), `SafetyPackPrompt.kt` |
| AI always runs in the cloud | `ai/OnDeviceModelSetup.kt`; the phone must support Gemini Nano (emulators do not) |
| AI never answers ("No AI" badge) | App Check: the debug token is not registered. Logcat tag `FirebaseAppCheck` prints it |
| Map blank offline | `features/offlinemap/OfflineMapSaver.kt` (must run once on wifi) |
| Safety photos never arrive | `features/safetyphoto/OutboxSender.kt`, `device/ConnectivityWatcher.kt` |
| Places look made up / empty | `features/osmplaces/OsmPlacesFetcher.kt` (server busy?), `PlacesEnricher.kt` |
| Ask Beacon answer is wrong or vague | `features/ask/AskBeaconPrompt.kt` (+ `AskBeaconPromptTest`): the AI only knows the facts listed there |
| Illustrated Lapa map: dot in the wrong place | `features/lapamap/LapaMapProjection.kt` (+ test). The demo pack's places and zones are placed with the same projection (`DemoRioPack.kt`) |
| Demo pack differs between Android, iOS and web | `shared/fixtures/rio-lapa-pack.json` is exported from `DemoRioPack.kt`; `DemoPackFixtureTest` fails on drift |
| Illustrated Lapa map: landmark misplaced | `LapaIllustratedMap.kt` |
| Colors / spacing / fonts | `design/Colors.kt`, `design/Type.kt`, `design/components/` |
| Scan verdict wrong (rate, price, "Nothing saved") | `features/scancheck/ScanJudge.kt` (+ `ScanJudgeTest`), the pack's `scams` |
| Scan reads nothing from a photo | `features/scancheck/ScanReader.kt` prompt, `ScanReadingParser.kt` (+ test) |
| Yellow ring missing or in the wrong place | `features/scancheck/RecommendedPlace.kt`, `lapamap/LapaBadges.kt`, `features/home/HomeScreen.kt` |
| Opening story (map route, text) | `features/onboarding/StoryStep.kt`, `StoryMap.kt` |
| Fonts (Sora / Inter not showing) | `design/Type.kt`: `HomewardFonts` still uses the system font until the .ttf files are added to `res/font` |
