# Beacon full app: plan and phase reports

Plan for the build prompt in `2026-11-24-beacon-build-prompt.md`. Phase reports are appended at the bottom as each phase ends.

## Baseline (Nov 24, before any change)

- `./gradlew test`: 49 tests, 0 failures. `./gradlew assembleDebug`: builds.
- Both need `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` and `ANDROID_HOME=~/Library/Android/sdk` (there is no `local.properties`, and the system `java` is not set up).

## Toolchains on this Mac

| Tool | Found | Note |
|---|---|---|
| JDK for Gradle | OpenJDK 21 (Homebrew) | Not on the PATH; export `JAVA_HOME` as above |
| Android SDK | platforms 35 and 37.0, build-tools 34 and 36 | AVDs: `Pixel_9`, `Medium_Phone_API_37.0` |
| Xcode | 27.2 (iOS 27.2 SDK) | Simulators: iPhone 17, 17e, Air, 18 Pro, 18 Pro Max |
| Node | 26.7.0, npm 11.19 | |
| Firebase CLI | 15.37.0, logged in | `homeward-6999c` shows in `firebase projects:list` |
| Config files | all three present | `app/google-services.json`, `ios/Beacon/GoogleService-Info.plist`, `web/firebase-config.js`; all git-ignored |
| Missing | `MAPS_API_KEY`, `CARTO_KEY`, xcodegen | No Routes key: routes use their fallback. The Xcode project file is written by hand |

## Where the prompt, the code and the current docs disagree

Checked on Nov 24 against the pages in section 12 of the prompt.

1. **Vite.** Section 2 step 4 says "build the Xcode and Vite projects"; section 10A says the web app keeps no build step. Following 10A: no Vite.
2. **Firebase JS SDK.** `web/js/ai.js` pins 12.4.0. Hybrid inference and `inferenceSource` need 12.5.0; the latest is 13.4.0 (Nov 16). Raising to 13.4.0.
3. **Chrome flag.** The prompt names the flag "Gemma 4 for Built-in AI". Firebase's web page names only `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` and Chrome 139 or later on desktop. The README will list the documented flag as required and the Gemma 4 one as "turn on if your Chrome has it".
4. **Android SDK versions.** The repo has `firebase-ai` 18.0.0, `firebase-ai-ondevice` 16.0.0-beta06, App Check debug 20.0.0. Current: 18.2.0, 16.0.0-beta08, 20.1.0. The on-device model is chosen with `OnDeviceConfig(modelOption = OnDeviceModelOption.PREVIEW)` (`STABLE` is the default, `PREVIEW_FAST` the fast one). The docs show `checkStatus()` and `download()` with no model option, so "download Nano 4, else use stable" has to be checked against the library itself in Phase 5.
5. **Fact 4.1 wording.** Firebase's pages say on-device inference is foreground-only but do not name `BACKGROUND_USE_BLOCKED`. The design consequence is unchanged.
6. **Structured output on device.** The docs now list JSON and enum output as supported on device on Android and web. The prompt keeps a defensive parser for on-device calls; keeping it as the fallback either way.
7. **iOS API shape.** There is no `InferenceMode` on iOS. A hybrid model is `HybridModel(primary:secondary:)` used through `ai.generativeModelSession(model:)` and `session.respond(to:)`. Where a call ran is the string `response.rawResponse.modelVersion` (`apple-foundation-models-system-language-model` means on device). On-device input is text only. SPM products: `FirebaseAILogic`, `FirebaseAppCheck`, Firebase 12.13.0 or later. The docs do not say whether the simulator has the model or what the minimum iOS is; both are checked at build and run time in Phase 3.
8. **Google Routes API terms (affects section 8 and two screens in section 9).** Read directly from the Maps Service Specific Terms, section 20:
   - 20.1: Routes content may be used without a Google map.
   - 20.2: "Customer must not use Google Maps Content from the Routes API in conjunction with a non-Google map." So a Google route may not be drawn on OpenStreetMap tiles, the illustrated Lapa map or MapKit.
   - 20.3: only latitude and longitude values may be cached, for up to 30 consecutive days. Step text, distance and duration are not listed, and the general terms (3.2.3 b) forbid caching anything not expressly allowed.
   - Policies page: showing Routes content without a Google map needs a "Google Maps" attribution next to it.
   - What this means: the prompt's fallback (show Google routes on a Google map view) covers 20.2, but storing step-by-step text in the pack for offline use is not covered by 20.3. This does not touch Phases 1 to 3. **Decision needed before Phase 4** (asked in the stop report): either (a) Google routes are online-only on a Google map view, with only the route's points kept for 30 days and offline answers limited to direction and distance plus the hand-checked Lapa route; or (b) use an OpenStreetMap-based router whose routes may be stored and drawn on every Beacon map.
9. **Walkthrough screenshots.** `docs/walkthrough/img/` shows the older navy "Homeward" build, not what the code draws now. They are replaced at the end of stretch 1.
10. **Demo pack drift.** `DemoRioPack` (Shell gas station, Police post Lapa, Hospital Souza Aguiar, 4 phrases), `web/js/pack.js` and the mockups (5º DP police station, Hospital Cruz Vermelha, 3 phrases) disagree, and the Android red-zone polygon does not sit under the red patch on the drawn map. Fix: `shared/fixtures/rio-lapa-pack.json` becomes the one source, exported from `DemoRioPack`; `DemoRioPack` takes the mockup's places at the positions the drawn map shows them; a web test checks `pack.js` against the fixture.
11. **Hard-coded person.** `AppServices.USER_NAME = "Noa"` and "Call her now" in `SosPrompt` and the template. Replaced by a small profile (name, how to refer to her).
12. **Locale bug.** `"%.4f".format(...)` in `GeoPoint.short()` and `MapsLink` follows the phone's language, so some phones would write `-22,9133` and break the map link. Forced to `Locale.US`.
13. **Engine and service order.** Section 6 puts the `IncidentEngine` in the session service's scope, but the service is Phase 4. Phase 1 adds a minimal `SafetySessionService` (foreground type `location`) so location updates keep going with the screen off; the microphone type, notification actions and the rest arrive in Phase 4.
14. **Stale docs fixed as files are touched.** README says Java 17; `ARCHITECTURE.md` says the SOS goes by push when online and that the fonts are missing; `design/README.md` names the old Figma file; `design/components/README.md` lists components that do not exist.
15. **Location on Home.** Section 3 says location is read only while a Safe Walk or SOS she started is running. Home already follows GPS while it is open, for the red-zone warning, and that stays: it is foreground only, and nothing is sent. Background reading happens only inside `SafetySessionService`.
16. **Open product question (not built).** After "Hold for SOS", nothing reaches contacts until she presses Send. If she cannot, nobody is told. An automatic send after a short countdown would close that gap; it is not in the prompt, so it is only raised in the stop report.

## Files

### Phase 1: Android vertical slice (`beacon/phase-1-slice`)

Add:
- `features/incident/contracts/`: `ActivationMethod`, `LocationFix`, `IncidentInput`, `Delivery` (status and per-contact delivery), `IncidentViewState`.
- `features/incident/`: `IncidentState` (state, events, effects), `IncidentReducer` (pure transitions), `IncidentEngine` (the `StateFlow` and effect runner), `IncidentViewStateMapper`, `Situation` + `SituationPicker` (keywords), `ActionChecklist` (the reviewed steps), `PhrasePicker`, `UpdateThrottle`, `IncidentMessages` (alert facts, update, battery low, ended, automatic alert).
- `features/sos/sending/`: `SmsGateway` (interface), `SmsStatusReceiver`, `SosOutbox`, `OutboxFlusher`; `features/sos/`: `DeliveryWording`, `ForMeCard`, `DeliveryList`, `EndSosButton`.
- `features/session/`: `SafetySessionService`, `SessionNotification`.
- `profile/`: `UserProfile`, `UserProfileStore`.
- `device/`: `SignalChecker`, `BatteryReader`, `LocationFixes`.
- `design/components/`: `HoldButton`, `InferenceBadge`, `QuickPickChips`.
- `app/src/debug/`: `FakeSmsGateway`, `TestMode` (debug only); `app/src/release/`: `TestMode` (always off).
- `shared/schema/`, `shared/fixtures/`, `shared/test-vectors/`, `shared/prompts/`; `docs/demo/` (a recorded Lapa route and the script that plays it into the emulator).
- Tests: reducer, mapper, situation, checklist, phrase picker, throttle, messages, delivery wording, outbox, shared vectors, fixture export.

Change: `AppServices`, `AiModels` (on-device-only model), `SosMessageWriter`, `SosPrompt`, `SmsSender`, `SosDispatcher`, `SosComposeScreen`, `SosSentScreen`, `SosViewModel` (thin adapter), `HomeBottomSheet` (hold for SOS), `HomeScreen`, `AppNavGraph`, `ContactsStep` and `ContactsScreen` (her name, wording), `GetReadyStep` (wording), `DemoRioPack`, `GeoPoint`, `MapsLink`, `LocationReader`, `CheckInSender`, `PackUpdater`, manifest, `app/build.gradle.kts`, every touched folder's `README.md`, `ARCHITECTURE.md`, the first-screens design doc.

### Phase 2: backend and family view (`beacon/phase-2-backend`)

- `firebase/`: `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, rules tests.
- Android `features/sync/`: anonymous sign-in, `IncidentSync` (trip, incident, updates, share), family link in the SMS.
- `web/js/`: `firebase.js` (app, App Check, Auth, Firestore), `router.js`, `family.js`, `familymap.js`, `summary.js`, `demo.js`, `incident.js`; changes to `ai.js`, `app.js`, `sos.js`, `sw.js`, `styles.css`; `web/package.json` with Vitest and Playwright tests; deploy.

### Phase 3: iOS core (`beacon/phase-3-ios`)

- `ios/Beacon.xcodeproj`, `ios/Beacon/` (App, AI, Design, Logic, Features, Services), `ios/BeaconTests/` running `shared/test-vectors/`.

### Phases 4 to 7 (stretch 2)

As in section 11 of the prompt: session service with microphone, tile, widget, Safe Walk, listening, `RiskScorer`, safety check, pack radius and refresh; web planner and pairing; iOS Action Button, Control Center, Live Activity; submission documents.

## Phase reports

(appended below as each phase ends)

### Phase 1: Android vertical slice (Nov 24)

**Built.** The contracts; `IncidentEngine` with a pure reducer; Hold for SOS (1.5 s, with a fill; double tap with TalkBack); SOS compose (description, mic through the phone's speech-to-text screen, five quick picks, editable message with an On device / Cloud / No AI badge); the SOS sent screen as the active-session screen with honest delivery wording; the outbox with sent and delivered reports; the three cards (reviewed checklist, message, phrase to show someone nearby); location updates, low-battery note, "I'm safe now, end SOS"; a minimal `SafetySessionService`; a profile (name, how to refer to her) instead of the hard-coded "Noa" / "her"; debug-only test mode; `shared/` with five schemas, the Rio fixture, a demo incident and nine test-vector files; a recorded Lapa walk in `docs/demo/`.

**Verified, and how.**
- Unit tests: 88 pass (49 before), in both debug and release variants: every reducer edge, the engine with a fake phone, throttle, messages, wording, outbox, and the nine shared vector files. `./gradlew test assembleDebug` is green.
- Emulator (`Pixel_9`, Android 17 / API 37): onboarding with the new name field, three permissions; Home on the illustrated map at the bar; a tap on Hold for SOS does nothing, a 2-second hold opens compose with a usable message at once; a quick pick changes the message, checklist and phrase; Send shows "Saved on your phone", then "Mom knows" with the green tick only after the (fake) delivery report; the recorded walk (`docs/demo/play-route.sh`) produced one location update after the 2-minute gap and 200 m, and the screen then said when it was sent; "I'm safe now" asked for confirmation, sent the ended message and stopped the service; with airplane mode on, Send stayed at "Saved on your phone. It sends when you have signal", and went to "Mom knows" within seconds of turning it off.
- The foreground service was confirmed running with type `location` (`dumpsys activity services`) and gone after the SOS ended.

**Not verified here.**
- **The "Cloud" badge.** The emulator has no Gemini Nano (logcat: "On-device model is not available", fallback to cloud), and the cloud call was refused: App Check rejected this install's debug token (403, "App attestation failed"). The app correctly fell back to the plain message with the "No AI" badge. Once the token is registered, "Cloud" should show; logcat tag `FirebaseAppCheck` prints the token and a ready-made `firebase appcheck:debugtokens:create ...` command.
- Needs a real Android phone with a SIM: real SMS sending, the radio's sent and delivered reports (`SmsStatusReceiver`), "waiting for signal" from a real no-service result, Gemini Nano and the "On device" badge, speech-to-text on the compose screen, battery-low update, GPS with the screen off for a long stretch.

**Section 4 facts re-checked.** (1) foreground-only: confirmed in Firebase's docs, not testable here. (2) single-turn text or text plus one Bitmap: confirmed; structured output is now also listed for on-device. (3) quota errors `BUSY` and `PER_APP_BATTERY_USE_QUOTA_EXCEEDED`: confirmed in the docs. (4) inference modes and `inferenceSource`: confirmed in the docs and in the library (`InferenceSource.ON_DEVICE` / `IN_CLOUD`); the fallback from on-device to cloud was seen in logcat. (5) Nano 4: `OnDeviceModelOption.PREVIEW` / `PREVIEW_FAST` exist in `firebase-ai` 18.2.0, and each model has its own `onDeviceExtension.checkStatus()` / `download()`, so "Nano 4 if downloadable, else stable" can be built as asked (Phase 5). (6) to (10) were not touched by this phase.

**Cut or moved.** The on-device model picking the situation (key words only for now) and the online "machine translated" custom sentence move to Phase 5 with the other new model instances. The session service has no microphone type or notification buttons yet (Phase 4).

**Mockup changes made (section 9).** SOS sent: green tick and "knows" only for delivered messages, otherwise "Saved on your phone" / "Sent to Mom" with the same layout; the screen now continues below the mockup's cards with the checklist, the phrase, the location line and "I'm safe now, end SOS". Contacts: "Only when you tap it. Beacon shares where you are only in an SOS or a Safe Walk you start." Get ready: "places to get help". New screens with no mockup, built in the same style: SOS compose, and the name / "refer to me as" block on the contacts step.

### Phase 2: backend and family view (Nov 24)

**Built.**
- Backend: `firebase/firestore.rules` and its tests; `firebase.json` and `.firebaserc` at the repo root (the Firebase CLI refuses to deploy a hosting folder outside the folder that holds `firebase.json`, so they could not live in `firebase/`). The data layout is `shared/schema/README.md`. A family link works through a "viewer" document: the page signs in anonymously, reads the share by its id, and claims a viewer document that the rules only accept with a live share for that trip.
- Android: `features/sync/` (anonymous sign-in, trip, share, incident and update documents for every message sent to contacts, the family link in the alert, an honest "Live link" line on the SOS screen). Nothing is written before she presses Send.
- Web: Firebase JS SDK 13.4.0, App Check and anonymous sign-in before the first AI call, "On this computer" / "Cloud" badges, the same message template as Android, the SOS written to Firestore with the family link, the family view at `/f/{shareId}`, `/demo`, a small router, the service-worker list with a test, `web/package.json` for tests only. Still no build step.
- `shared/prompts/` with the three prompt texts; Android and web both test that they send exactly these.
- Android's Ask Beacon now answers from saved facts by plain rules when no model can (the web already did).

**Verified, and how.**
- Tests: Android 102 unit tests (debug and release); rules 18; web 79 unit and 5 browser tests on the Auth, Firestore and Hosting emulators. I ran all three suites myself after the web agent finished.
- Rules reviewed by hand against what Android and web write, then deployed. The database was created the same day with the default locked rules, so nothing was overwritten.
- Emulator to real project: an SOS on the `Pixel_9` emulator wrote its trip, share, incident and updates with no refusals; the message carried the family link; the screen said "Live link: up to date."
- **Hosted, live:** `https://homeward-6999c.web.app` is deployed (26 files: the page, styles, `sw.js`, `js/`, `fixtures/`). `/__/firebase/init.json` has an `appId`. The Android emulator's SOS opened at `/f/{its share id}` in a browser and showed the alert, the location update, the trail on the map and "Ended". `/demo` replays the made-up incident. `firebase-config.js`, the tests and `package.json` are not served.
- Web against the real project on localhost (by the web agent): a web SOS wrote through the deployed rules and its family view switched to "Ended".

**Not verified.**
- **Any AI answer or badge on the web.** App Check rejects the localhost debug token until it is registered (403, then 401), so Ask Beacon, the SOS sentence and the family summary all took their no-AI fallbacks. The hosted site has no AI at all until a reCAPTCHA Enterprise site key is put in `web/appcheck-config.js`; it logs one harmless console error for that missing file.
- Gemini Nano in Chrome: needs a real Chrome profile with the flags on. Chrome 158 on this Mac has `prompt-api-for-gemini-nano`, `prompt-api-for-gemini-nano-multimodal-input` and `gemma4-for-built-in-ai` in its binary; nobody has opened `chrome://flags` to turn them on.
- The "Cloud" badge on Android, for the same App Check reason.

**Decisions made along the way.**
- A web SOS writes the alert and the end, not continuing location updates (a browser tab is not a tracker).
- The family view always uses the traveler's name, never "she" or "he".
- `web/serve.py` was added as the local server: plain `python3 -m http.server` dropped files when the Mac was busy and cannot serve `/f/...`.
- The hosted page takes its Firebase config from Hosting's own `/__/firebase/init.json`, so no config file is uploaded.
- App Check on Android still uses the debug provider in every build. A release APK that judges sideload cannot pass Play Integrity, so how judges' installs get past App Check has to be decided before Phase 7.

**Left over.** One test trip named "Web test" and two anonymous users may remain in the real project from the web agent's first run (its cleanup output was cut off). The incidents I made from the emulator (traveler "Noa") are also there.
