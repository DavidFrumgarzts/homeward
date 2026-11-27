# Beacon

**Safety help that works with no signal.** Built for #BuildHybridAI 2026 (Firebase AI Logic).

**Prepare online, rely on it offline:** the cloud model with Google Search builds a city's safety pack while you have wifi, and the on-device model answers from that pack when you have nothing.

After the army, my sister went to India with no plan, no local numbers and often no signal. Nothing happened,
but if it had, she couldn't have reached anyone. Beacon is for that moment, for her and for the family at home.

> Find My tells your mom where you are. Beacon tells her what's happening and what to do.

Beacon is three native apps on one Firebase project: **Android**, **iOS** and **Web** (desktop Chrome). The repo and the code package are still called `homeward`, the project's first name.

## What it does

- **Red-zone warnings on the walk home (offline):** the map buzzes when you head toward a red area at night, says why, and shows the nearest open place to get help. In Lapa, Rio, the map is an illustrated one; everywhere else it is a real street map.
- **Ask Beacon (on-device AI, cloud fallback):** a chat that answers from the city's safety pack: "What's the police number?", "Is this area OK now?". It only uses saved facts and never guesses a phone number. With no AI at all, plain rules answer from the same facts.
- **Hold for SOS:** hold the red button, say what's happening in a few words. The phone's AI rewrites them into one clear sentence; the app adds your location, the time, a map link and what to do. You check it, then it goes to your trusted contacts.
- **Honest delivery:** the app says "Saved on your phone", "Sent to Mom" or "Mom knows", and only says "knows" when the message was reported delivered. With no signal the message waits on the phone and goes out when signal returns.
- **While the SOS is on:** a checklist for your situation, one tap to call the local emergency number, the nearest open place, a phrase in the local language to show someone nearby, and location updates to your contacts (after 200 m or 5 minutes). "I'm safe now" ends it and tells them.
- **Family view (web):** the SOS text carries a link. A contact opens it in a browser and follows the incident live: a map, how old the last position is, what happened, the local emergency numbers, and a short "what should I do?" written on their own computer.
- **Safety pack (cloud):** Gemini with Google Search researches the city: police and ambulance numbers, your embassy, emergency phrases, and areas by time of night. Places to get help (police, hospitals, pharmacies, 24h gas stations) come from **OpenStreetMap**, so they're real, not AI guesses.
- **Safety photos (on-device AI):** snap a taxi plate; the phone reads it offline and sends it to family when you're back online.

## How it uses Firebase AI Logic (hybrid inference)

Every AI-written text carries a badge taken from the SDK's own answer: **On device** (or "On this computer"), **Cloud**, or **No AI**.

| Job | Android (Gemini Nano via AICore) | iOS (Apple Foundation Models) | Web (Gemini Nano in Chrome) |
|---|---|---|---|
| Research a city for the pack | Cloud only, with Google Search | Cloud only (wired, no screen yet) | Phase 5 (trip planner) |
| Rewrite her words into the SOS sentence | On device first, cloud fallback, plain template last | On device first, cloud fallback, plain template last | On this computer first, cloud fallback, plain sentence last |
| Ask Beacon: answer from the saved pack | On device first, cloud fallback, plain rules last | On device first, cloud fallback, plain rules last | On this computer first, cloud fallback, plain rules last |
| Family view: "What's happening and what should I do?" | | | On the contact's computer first, cloud fallback, fixed wording last |
| Read a safety photo, explain a red zone | On device | | |
| State machine, updates, checklist, phrase, delivery wording, zones | No AI | No AI | No AI |

The model only rewrites or answers from text it is given. Phone numbers, places, coordinates and links come from the saved pack or from code, never from model output. See [ARCHITECTURE.md](ARCHITECTURE.md).

## Repo layout

| Folder | What | Build tool |
|---|---|---|
| [`android/`](android/) | Android app (Kotlin, Compose). A Gradle project: `android/app/` is the module | Gradle (`android/gradlew`) |
| [`ios/`](ios/) | iOS app (SwiftUI) | Xcode (`ios/Beacon.xcodeproj`) |
| [`web/`](web/) | Web app for desktop Chrome, plus `web/live/` (Beacon live) and `web/ny/`. No build step | none to run; `npm` for tests |
| [`shared/`](shared/) | What all three apps share: data shapes, demo fixtures, AI prompt texts, test vectors | read by each platform's tests |
| [`backend/`](backend/) | Server-side code all three apps use: `backend/firebase/` (Firestore rules and their tests), `backend/functions/` (Cloud Functions, e.g. sending texts) | Firebase CLI, `npm` |
| [`docs/`](docs/) | Design rules, specs, demo material | |

`firebase.json` and `.firebaserc` stay at the repo root: the Firebase CLI only hosts a folder inside the one holding `firebase.json`, and it points at `web/`, `backend/firebase/` and `backend/functions/` from there. New logic that more than one app needs goes into `shared/` (data, prompts, test vectors) or `backend/` (code that runs on a server), not into one app's folder.

## Build and run each platform

| Platform | Build / test | Run |
|---|---|---|
| Android | `cd android && ./gradlew testDebugUnitTest assembleDebug` | `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` |
| iOS | `xcodebuild test -project ios/Beacon.xcodeproj -scheme Beacon -destination 'platform=iOS Simulator,name=iPhone 17'` | open `ios/Beacon.xcodeproj` in Xcode, Run |
| Web (Chrome) | `cd web && npm install && npx vitest run` | `python3 web/serve.py`, open http://localhost:4173 in Chrome |
| Backend | `cd backend/firebase && npm install && npm test`; `cd backend/functions && npm test` | `firebase deploy --only hosting,firestore,functions --project homeward-6999c` (from the repo root) |

Details for each are below and in each folder's README.

### Android

Gradle here needs Java 21 (not the Java 25 bundled with Android Studio):

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=~/Library/Android/sdk
```

```bash
cd android && ./gradlew test assembleDebug
```

```bash
~/Library/Android/sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

- In Android Studio, open the `android/` folder (not the repo root).
- `android/app/google-services.json` must be on disk (Firebase console > Project settings > the Android app, package `app.homeward`). It is git-ignored.
- On an emulator, debug builds run in **Test mode: no real SMS**: nothing is sent, and each text is shown as sent, then delivered, so the screens can be checked. Release builds always use the real sender.
- On-device AI needs a phone with Gemini Nano (Pixel 9 or newer, recent Samsung flagships). Emulators have none and fall back to the cloud.
- Optional: `CARTO_KEY=your_key` in `android/local.properties` for the Google Maps-like map style. Without it the app uses plain OpenStreetMap tiles.
- A recorded walk for demos: `./docs/demo/play-route.sh` plays it into a running emulator.

### iOS

See [ios/README.md](ios/README.md): `xcodebuild` and `xcrun simctl` commands, signing with a free Apple ID, what is built.

### Web

See [web/README.md](web/README.md). In short: `python3 web/serve.py`, then open http://localhost:4173 in desktop Chrome. `/demo` shows the family view with a made-up incident.

### Backend

Firestore rules, their tests and the deploy command are in [backend/firebase/README.md](backend/firebase/README.md). Cloud Functions are in [backend/functions/](backend/functions/). The data layout is in [shared/schema/README.md](shared/schema/README.md).

### App Check (needed before any cloud AI call works)

App Check is enforced for Firebase AI Logic in the project. Each debug install prints its own debug token once; paste it in Firebase console > App Check > Apps > that app's menu > Manage debug tokens.

- Android: Logcat, tag `FirebaseAppCheck` (it also prints a ready-made `firebase appcheck:debugtokens:create ...` command).
- iOS: the Xcode console, line `Firebase App Check debug token: ...`.
- Web: Chrome's DevTools console on localhost, line `Firebase App Check debug token: ...`.

Until a token is registered the apps still work: answers come from the plain rules and the SOS uses the plain sentence, marked "No AI".

## What the three apps share

`shared/` holds the data shapes, the demo pack for Lapa, a demo incident, the prompt texts and nine files of test vectors. Each platform's unit tests run the vectors, so zones, the place picker, the messages and the incident state machine give the same answers everywhere.

## Status (Nov 25, 2026)

- **Android:** opening story, setup, safety pack, illustrated and street maps, red-zone warning, Ask Beacon, Hold for SOS with the incident engine, honest SMS delivery with an outbox, location updates, the family link, Firestore sync, "I'm OK", safety photos, police call. Checked on an emulator; not yet on a real phone.
- **Web:** the traveler flow, the family view and `/demo`.
- **iOS:** setup, Home on Apple Maps, Ask Beacon, SOS through Messages with Firestore sync.
- **Not built yet:** the Quick Settings tile, widget, Safe Walk, listening and safety checks (the state machine already handles them), the web trip planner, iOS Live Activity and Action Button, walking routes.
- **Needs real hardware to prove:** Gemini Nano on Android and the "On device" badge, real SMS sending and delivery reports, Apple's on-device model and the Messages composer on an iPhone.

The plan, what was verified and how, and what is still open are in [docs/specs/2026-11-25-beacon-full-app-plan.md](docs/specs/2026-11-25-beacon-full-app-plan.md).

Design: Figma file "Beacon v2" (exported screens in `docs/beacon-demo/img/`). Team: David Frumgarzts (design), Alwis Lim and Julia (tech).

Map and places: © OpenStreetMap contributors (ODbL), credited on the map screens.

## License

Apache 2.0
