# Beacon: where the build stands

Written Nov 25, 2026, for anyone (a person or a coding agent) picking this up. It is the short version; the full record is in [`specs/2026-11-25-beacon-full-app-plan.md`](specs/2026-11-25-beacon-full-app-plan.md), and the brief being built is [`specs/2026-11-24-beacon-build-prompt.md`](specs/2026-11-24-beacon-build-prompt.md).

## In one paragraph

Beacon is a travel-safety app for the #BuildHybridAI 2026 hackathon (Firebase AI Logic hybrid inference; submissions close **Nov 30, 2026, 2:00 PM PST**). It ships on Android, iOS and web on one Firebase project, `homeward-6999c`. The build prompt has seven phases in two stretches. **Stretch 1 (Phases 1 to 3) is done. Phase 4 has only just been started. Phases 5 to 7 have not been started.**

## Branches

Each branch sits on top of the one before it. Nothing has been merged to `main`.

| Branch | Holds |
|---|---|
| `beacon/build-prompt` | The build prompt |
| `beacon/phase-1-slice` | Android: incident engine, hold for SOS, honest SMS delivery, `shared/` |
| `beacon/phase-2-backend` | Firestore rules, Android sync, web family view, `/demo`, hosting config |
| `beacon/phase-3-ios` | The iOS app, and the stretch 1 reports |
| `beacon/phase-4-session` | Phase 4 so far: schema changes and the routing decision only. **The newest branch; start here.** |

## What works today

- **Android** (`app/`): onboarding, Home on the illustrated Lapa map or a street map, Ask Beacon, hold for SOS, compose with an AI-rewritten sentence, an outbox with real sent and delivered reports, the active SOS screen (checklist, call button, nearest open place, phrase to show someone), location updates, "I'm safe now", Firestore sync and the family link in the SMS. 102 unit tests.
- **Web** (`web/`, no build step): the traveler flow, the family view at `/f/{shareId}`, and `/demo`. 79 unit tests and 5 browser tests.
- **iOS** (`ios/`): onboarding, Home on Apple Maps, Ask Beacon, SOS through Messages with Firestore sync. 38 tests.
- **Backend** (`firebase/`, `firebase.json`): Firestore rules with 18 tests, deployed. Hosting is live at **https://homeward-6999c.web.app**.
- **Shared** (`shared/`): data shapes, the Rio demo pack, a demo incident, prompt texts, and nine test-vector files that all three platforms run.

Checked end to end: an SOS sent from the Android emulator and one from the iPhone simulator both appear in the hosted family view, with their location updates and "Ended".

## What is not verified

- **No AI answer or badge has been seen on any platform.** App Check is enforced for Firebase AI Logic, and no debug token has been registered yet, so every app showed its "No AI" fallback. Registering the tokens is the first thing to do (see the checklist in the plan, section "Stop after Phase 3").
- The hosted site has no AI at all until a reCAPTCHA Enterprise site key is put in `web/appcheck-config.js`.
- Nothing has run on a real phone: Gemini Nano and the "On device" badge, real SMS and delivery reports, Apple's on-device model, the Messages sheet.
- The stretch 1 checklist for a person (ten steps) has not been run.

## Decisions made

- **Routes come from an OpenStreetMap-based router, not the Google Routes API.** Google's terms forbid drawing its routes on a non-Google map and storing step text. The service chosen is the FOSSGIS OSRM server (walking profile, no key, one request a second at most, OpenStreetMap credit with a "fix the map" link). Details are in the plan.
- Android debug builds on an emulator run in "Test mode: no real SMS". Release builds always use the real sender.
- A family link works through a "viewer" document checked by the Firestore rules; see `shared/schema/README.md`.
- The demo pack was moved onto the drawn Lapa map's coordinates, and `shared/fixtures/rio-lapa-pack.json` is exported from Android's `DemoRioPack` (a test fails on drift).

## Decisions still open

1. **Hold for SOS, then no Send.** Nothing reaches contacts until she presses Send. Should an alert go out by itself after a countdown?
2. **Judges' APK and App Check.** A sideloaded release APK cannot pass Play Integrity. How do judges' installs get a valid token?
3. **"Open now, hours not listed."** Places with no listed hours are assumed open in the daytime. More honest wording would change shared text on all three platforms.

## What is left

- **Phase 4 (Android session and input):** the session service with the microphone type and notification buttons, the Quick Settings tile and talk screen, widget, home base, Safe Walk, listening modes, `RiskScorer`, the safety check screen, the safe phrase, the SOS button in Ask Beacon, adaptive pack radius, the refresh job, tracking tiers, and saved walking routes. `RiskScorer` and the phrase matcher also go into the shared vectors and onto iOS. The state machine already handles safety checks; nothing raises one yet. Only the schema work is done.
- **Phase 5:** the web trip planner and pairing code (the `pairings/{code}` document is specified but has no rules yet), pack download by code on both phones, iOS Action Button, Control Center control and Live Activity, the on-device verdict on a safety check, the "AI activity" screen, Remote Config for model names, Nano 4 selection, Android Live Update.
- **Phase 6 (stretch):** iOS Safe Walk and listening, web notifications.
- **Phase 7 (never skip):** README per platform, the three-minute demo script, demo modes, a release APK, refreshed `docs/beacon-demo/` and `docs/walkthrough/` (its `index.html` still shows the old "Homeward" screenshots).
- If time runs short, the prompt says: drop Phase 6 first, then the parts of Phase 4 that need a real Android phone to show (listening, widget, Live Update), then the parts of Phase 5 not in the demo script.

## Before the repo is shown to judges

- The walkthrough screenshots show the family links of test trips (made-up names, simulated positions). Delete those test documents in the Firestore console.
- One trip named "Web test" and two anonymous users may remain in the project from a test run.

## How to run and test

Commands for each platform are in the root [`README.md`](../README.md), [`ios/README.md`](../ios/README.md), [`web/README.md`](../web/README.md) and [`firebase/README.md`](../firebase/README.md). On this Mac, Gradle needs Java 21:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=~/Library/Android/sdk
```

The three config files (`app/google-services.json`, `ios/Beacon/GoogleService-Info.plist`, `web/firebase-config.js`) are git-ignored and must be on disk.

## How the work was done

One coding session wrote the Android slice and the shared contract first, then two parallel agents built the web and backend half and the iOS app to written briefs, each inside its own folders. Their work was reviewed, tested again and committed by the main session. Codebase rules are in the build prompt, section 3: one job per file, a README in every folder, pure logic with unit tests, AI models created in one place, every AI call with a non-AI fallback.
