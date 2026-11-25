# Beacon for iPhone

The traveler app for iOS, in SwiftUI. Same product, data and behaviour as the Android app; the UI is native.
Start with `Beacon/README.md` for the folder map.

## How it uses Firebase AI Logic

Hybrid inference, through the Firebase Apple SDK (Swift Package Manager only):

| Job | Where it runs | File |
|---|---|---|
| Write the SOS sentence from her words | On the iPhone (Apple's Foundation Models, with Apple Intelligence), Gemini in the cloud as fallback | `Beacon/Features/Sos/SosMessageWriter.swift` |
| Ask Beacon: answer from the saved pack | On the iPhone, cloud as fallback; plain rules when no AI can answer | `Beacon/Features/Ask/AskBeacon.swift` |
| Research a city for a pack | Cloud only, with Google Search (wired, not used on a screen yet) | `Beacon/AI/AiModels.swift` |
| Zones, place picker, messages, state machine | No AI: plain logic, offline | `Beacon/Logic/` |

Every AI answer shows where it was written: "On device", "Cloud", or "No AI: saved answer". All models are created in `Beacon/AI/AiModels.swift`.

## Build, test, run (Xcode 27.2, an iPhone 17 simulator)

From the repo root:

```bash
xcodebuild build -project ios/Beacon.xcodeproj -scheme Beacon -configuration Debug -derivedDataPath ios/build -destination 'platform=iOS Simulator,name=iPhone 17'
```

```bash
xcodebuild test -project ios/Beacon.xcodeproj -scheme Beacon -derivedDataPath ios/build -destination 'platform=iOS Simulator,name=iPhone 17'
```

```bash
xcrun simctl boot "iPhone 17"; open -a Simulator
```

```bash
xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/Beacon.app
```

```bash
xcrun simctl location booted set -22.9095,-43.18421
```

```bash
xcrun simctl launch booted app.homeward
```

- Add `-resetBeacon YES` to the launch command to start again from the opening story, or `-demoSetup YES` to skip setup with a made-up traveler and three made-up contacts (debug builds only).
- To replay the recorded walk in Lapa (`docs/demo/lapa-walk.csv`) as the phone's position:

```bash
tail -n +2 docs/demo/lapa-walk.csv | xcrun simctl location booted start --speed=4 --interval=2 -
```

  (Give the waypoints on stdin as above. Passed as arguments they start with a minus sign and are silently ignored.)
- To see what the server said to each Firestore write (accepted or refused, and which document), and the debug read-back that proves the family link has data:

```bash
xcrun simctl spawn booted log stream --info --predicate 'subsystem == "app.homeward"'
```

- The first build downloads the Firebase packages (a few minutes). `ios/build/` is build output and is git-ignored.
- Or open `ios/Beacon.xcodeproj` in Xcode and press Run.

## Before AI works: Firebase config and App Check

1. `Beacon/GoogleService-Info.plist` must be on disk (Firebase console > Project settings > the iOS app, bundle id `app.homeward`). It is git-ignored.
2. App Check is enforced for AI Logic in the project, so every cloud AI call is refused until this app's debug token is registered. Run the app once and look in the Xcode console (or `xcrun simctl spawn booted log stream --predicate 'process == "Beacon"' | grep "debug token"`) for:
   `Firebase App Check debug token: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
   Paste that value into Firebase console > App Check > Apps > the iOS app's menu > Manage debug tokens. The token is a secret: don't commit or share it.
3. Until then Ask Beacon answers from its saved rules ("No AI: saved answer") and the SOS uses the plain sentence. That is the designed fallback, not an error.
4. Release builds use App Attest instead of the debug provider; the app must be registered for App Attest in the console first.

## On a real iPhone (free Apple ID)

1. Open `ios/Beacon.xcodeproj`, select the Beacon target > Signing & Capabilities, tick "Automatically manage signing" and choose your personal team.
2. Plug in the iPhone, pick it as the run destination, press Run, and trust the developer profile on the phone (Settings > General > VPN & Device Management).
3. A free Apple ID signs an app for 7 days and cannot use TestFlight. TestFlight, and App Attest for release builds, need the paid Apple Developer Program.
4. If Xcode says the bundle id `app.homeward` is not available for your team, the id is registered to someone else's team; use that team, or change the id here and add a matching iOS app in the Firebase console.

## What is built

- Setup: the two-part story on the drawn Lapa map, welcome, contacts (her name, how to refer to her, the iOS contact picker, typed numbers), location permission, "get ready" with the bundled Rio pack and an honest line about Apple Intelligence on this device.
- Home: Apple Maps with the pack's zones and places drawn on it, the red-zone alert and buzz, the nearest open place to get help, I'm OK, Police, Hold for SOS (1.5 second hold with a visible fill; VoiceOver double tap).
- Ask Beacon: chat answered from the pack, with the inference badge.
- SOS: describe (type, dictate with the keyboard, five quick picks), editable text with its badge, Send. Send opens Messages with every contact and the text filled in, and at the same moment writes the trip, share, incident and first update to Firestore with the family link in the text. While the SOS is on, location updates go to Firestore under the same rules as Android (200 m or 5 minutes, at most one every 2 minutes, one catch-up update after a gap with no connection). The active screen says honestly what happened on each path.
- The same pure logic as Android, checked by the nine shared vector files in `shared/test-vectors/`.

## What is not built yet, and limits to know about

- **An iPhone app cannot send a text by itself.** She presses send in Messages. iOS never tells an app that a text was delivered, so the screen says "Sent to …" at most, never "… knows".
- **The simulator cannot open Messages.** Debug builds show "Test mode: Messages is not available in the simulator" with the text instead.
- **The simulator cannot run Apple's on-device model.** It reports the model as available but refuses every request ("Simulator is not supported"), so on the simulator the pass is the "Cloud" badge (after the debug token is registered). "On device" needs a real iPhone with Apple Intelligence (iPhone 15 Pro or later).
- **Location is "While Using the App" only.** Updates go out while Beacon is on screen during an SOS; background updates (and the Live Activity that goes with them) are a later phase.
- Not built yet: Live Activity and Dynamic Island, Action Button and Control Center control, Siri shortcut, Safe Walk, listening and safety checks, home base, safe phrase, pack download by pairing code, building a pack on the phone (the cloud research model is wired but no screen calls it).
- The pack is the one bundled from `shared/fixtures/rio-lapa-pack.json`.
- Minimum iOS 18.1. Swift 6 language mode. Firebase Apple SDK 12.19.3 (12.13.0 or later is required for hybrid inference).

## Checked on the simulator (Nov 24), and what still needs a real iPhone

Checked on an iPhone 17 simulator: the whole setup, Home with the Lapa zones and places, Ask Beacon (answered by the saved rules, because the cloud call is refused until the App Check debug token is registered), Hold for SOS, the compose screen, Send in test mode, the active screen, a location update two minutes later on the recorded walk, and ending the SOS. The real Firestore project accepted the trip, the share, the incident and the updates, in that order, and a read-back from the server showed `updates [alert, update, ended]` and `phase Resolved`.

Not provable on a simulator: Apple's on-device model and the "On device" badge, the Messages sheet and pressing send, the phone dialer, the hold gesture's haptic, VoiceOver, App Attest, and what the map shows with no connection at all.
