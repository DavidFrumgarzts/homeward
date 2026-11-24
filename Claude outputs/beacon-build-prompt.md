# Build prompt: Beacon (repo: Homeward) for #BuildHybridAI 2026

Paste everything below into your coding agent, opened at the root of `github.com/DavidFrumgarzts/homeward`.

---

## 1. What you are doing

You are extending an existing Android app into a complete travel-safety product for a hackathon submission. Do not start over and do not restructure what already works.

- **Product:** the app is called Beacon in everything a user sees (`app_name` is already "Beacon"). The repo and the code package stay `homeward` / `app.homeward`; do not rename packages, classes or folders.
- **Already built** (keep, extend, do not rebuild): onboarding with an opening story on the illustrated Lapa map, a contacts picker, a "get ready offline" step; Home as a map with a bottom sheet; the Lapa illustrated map (`features/lapamap/`); Ask Beacon, an offline chat answered from the saved pack (`features/ask/`); a manual "I'm OK" message to family with optional location (`features/checkin/`); on-device SOS writing, SMS sending, safety photos, red-zone warnings, OpenStreetMap places.
- **Promise:** a traveler in an unfamiliar place with little or no connectivity gives the smallest possible signal that something is wrong. The app tells her what to do, keeps her trusted contacts informed without her doing anything, and gives her something to show a stranger nearby.
- **Hackathon:** #BuildHybridAI 2026 (Firebase AI Logic hybrid inference). Submissions close **Nov 30, 2026, 2:00 PM PST**. Judged on technical implementation (how well hybrid inference is used), design (a complete product, not a proof of concept), potential impact, and quality of the idea (creative, non-obvious use of Firebase AI Logic).
- **Platforms:** Beacon ships on **Android, iOS and Web (desktop Chrome)**, all on one Firebase project. The hackathon gives multi-platform apps strong consideration for the Grand Prize, so all three must be real, working apps that use Firebase AI Logic hybrid inference, not mock-ups. Each platform uses its native stack, because the hybrid on-device APIs only exist in the native SDKs (section 10A). Sections 3 to 10 describe the Android app; section 10A describes the shared backend, iOS and Web.
- **Shape of the app:** one pipeline in three layers. Input is how a safety session starts and what it captures. Processing is the incident state machine and everything the SOS does. Display is the map, screens, design and UX. The layers talk only through the contracts in section 5.

## 2. Before you write code

1. Read `README.md`, `ARCHITECTURE.md`, `docs/specs/2026-11-24-first-screens-design.md`, `app/build.gradle.kts`, `AndroidManifest.xml`, `app/AppServices.kt`, `ai/`, `design/` (including `components/`), `navigation/`, `features/home/`, `features/onboarding/`, `features/ask/`, `features/checkin/`, `features/lapamap/`, `features/sos/` (including `sending/`), `features/safetypack/`, `features/safetymap/`, `features/safeplace/`, `features/offlinemap/`, `features/osmplaces/`, `features/safetyphoto/` and `device/`. Then look at every image in `docs/beacon-demo/img/` and `docs/walkthrough/img/` (section 9).
2. Run `./gradlew test` and `./gradlew assembleDebug` and record the baseline. If either fails before your changes, stop and report.
3. Check the other toolchains and record what is missing: `xcodebuild -version` (Xcode with the iOS 26 SDK), `node --version` (20 or later), `firebase --version` and whether `firebase login` is done, and whether `ios/Beacon/GoogleService-Info.plist` exists. A missing toolchain only blocks that platform: build everything else and list exactly what the person must install.
4. Write a short plan to `docs/specs/2026-11-25-beacon-full-app-plan.md`: files to add, files to change, and anything in this prompt that the code or current documentation contradicts. Then start Phase 1 without waiting, unless you found a contradiction that changes the design.

## 3. Rules of this codebase (keep them)

- One job per file, aim for under 150 lines. Every folder has a `README.md` listing its files. Update those and `ARCHITECTURE.md` in the same commit as the code.
- Pure logic (no Android, no AI) lives in its own file with a unit test in `app/src/test/`. Take time and location as parameters so tests control them, as `ApproachDetector` does.
- Screens never call Firebase or Android APIs directly. Shared objects come from `AppServices`. AI models are created only in `ai/AiModels.kt`.
- The on-device model only rewrites or classifies text it is given. Phone numbers, places and phrases come from the saved pack, never from model output. Every AI call has a non-AI fallback that returns something usable.
- She sees and can edit any AI-written message before it is sent. The one exception is the automatic alert in section 7, which uses a fixed template and no AI.
- Zones describe places and times, never people. Call places "nearby places to seek help", not "safe" as a guarantee.
- Exact location goes only to trusted contacts: during an active SOS, or in an "I'm OK" message when she turned that on. Location is read on the phone only while a Safe Walk or SOS she started is running.
- Two words must not be mixed up. **"I'm OK"** is the existing message she sends family herself (`features/checkin/`); the same button also answers a safety check and, with a confirmation, ends an active SOS. A **safety check** is the app asking her "Are you OK?" (section 7). Use these names in code and UI.
- Never commit `google-services.json`, `local.properties` or keys. Work on a branch per phase (`beacon/phase-1-slice`, ...), small commits in the existing style, and do not push or open a PR unless asked.

This task reverses two earlier decisions in `docs/specs/2026-11-24-first-screens-design.md`: live location updates to contacts are now in scope (only while an SOS is active), and the dark navy theme is replaced by the warm light Figma "Beacon v2" look already in `design/Colors.kt`. Update the doc to say so.

## 4. Platform facts that shape the design

These were checked against the documentation on Nov 24, 2026. The hybrid API is experimental, so re-check each one on a real device and report any that no longer hold. Sources are in section 12.

1. **Gemini Nano runs only while the app is the top foreground app.** Calls made from the background, including from a foreground service, fail with `BACKGROUND_USE_BLOCKED`. Nano cannot analyse a conversation while the phone is in a pocket. Background detection must therefore be deterministic code, and Nano runs once a safety check or SOS screen is on top.
2. **On-device inference is single-turn text from text, or from text plus one Bitmap.** No audio input, no chat. Speech must be transcribed by a separate on-device recogniser first.
3. **AICore has per-app quotas** (`BUSY`, `PER_APP_BATTERY_USE_QUOTA_EXCEEDED`). Never call Nano in a loop or on a timer. Call it on events only, with backoff.
4. **Inference modes:** `PREFER_ON_DEVICE` falls back to cloud; `ONLY_ON_DEVICE` throws if the model is unavailable; `PREFER_IN_CLOUD` falls back to on-device when offline; `ONLY_IN_CLOUD` throws when offline. `response.inferenceSource` says where a call ran. Config is fixed per `GenerativeModel` instance.
5. **Gemini Nano 4** is a preview model selected with `OnDeviceModelOption.PREVIEW` or `PREVIEW_FAST` and needs the AICore Developer Preview on the device. Make the model option one constant in `AiModels.kt`; default to `STABLE`.
6. **A foreground service that uses the microphone cannot be started while the app is in the background.** The session service must be started from a visible screen with types `location|microphone`, and the microphone opened and closed inside that running service. Outside a session, leaving a safe zone can only post a notification that opens the app.
7. **Background location without a foreground service is delivered only a few times an hour.** Tracking needs the session foreground service.
8. **Map tiles cannot be bulk-downloaded from the current providers.** tile.openstreetmap.org prohibits offline and prefetch use outright; `MapStyle.kt` records that CARTO forbids bulk download and caps device caching at 30 days. Keep `OfflineArea`'s small cap for raster tiles from these providers.
9. **Overpass public servers** ask for roughly under 10,000 requests and 1 GB per day, counted per app across all its users, and far less for an app that calls regularly. One query per pack build, a unique User-Agent, cached results.
10. **Android 16 Live Updates** (`Notification.ProgressStyle`, promoted ongoing notifications, `POST_PROMOTED_NOTIFICATIONS`) are the equivalent of an iOS Live Activity. They need `compileSdk 36`; the repo is on 35.

## 5. Shared contracts (build these first, in `features/incident/contracts/`)

Plain Kotlin data classes, `@Serializable`, no Android types. Adjust names to fit the code, keep the fields.

```kotlin
enum class ActivationMethod { SosButton, Widget, TalkTile, AskBeacon, VoiceShortcut, SafePhrase, SafetyCheckEscalation, SafeWalkMissedArrival }

data class LocationFix(val point: GeoPoint, val takenAtMillis: Long, val accuracyMeters: Float?)

data class IncidentInput(                 // input -> processing
    val sessionId: String,
    val method: ActivationMethod,
    val userConfirmed: Boolean,           // false when the app raised it without her tapping
    val description: String,              // her words or a quick pick, kept verbatim; may be empty
    val triggerReasons: List<String>,     // plain words, e.g. "left planned route", "said 'help'"
    val location: LocationFix?,           // null if no fix; never invent one
    val online: Boolean,
    val startedAtMillis: Long,
)

enum class DeliveryStatus { SavedOnPhone, WaitingForSignal, Sent, Delivered, Failed }

data class ContactDelivery(val contactName: String, val channel: SendChannel, val status: DeliveryStatus, val updatedAtMillis: Long)

enum class IncidentPhase { Inactive, SafetyCheckRequested, SosActive, Resolved }

data class IncidentViewState(             // processing -> display
    val phase: IncidentPhase,
    val forMe: List<String>,              // short checklist from approved actions
    val emergencyNumber: String,          // from the pack
    val suggestedPlace: SafePlacePicker.Pick?,
    val contactMessage: String,           // editable draft
    val contactMessageRanOnDevice: Boolean?,
    val showNearby: Phrase?,              // reviewed phrase from the pack
    val deliveries: List<ContactDelivery>,
    val lastFix: LocationFix?,            // UI shows its age
    val safetyCheckSecondsLeft: Int?,
)
```

`SavedSafetyPack` is the existing `SafetyPack`, extended in section 8. The input layer only produces `IncidentInput`. Screens only render `IncidentViewState` and call a small set of intents (`describe`, `editMessage`, `send`, `imOk`, `callEmergency`). Nobody parses AI prose to get structured values.

## 6. Processing: incident state machine

Create `features/incident/` with an `IncidentEngine` that owns all state and is the only writer of `IncidentViewState` (a `StateFlow`). It must survive the activity being closed, so it lives in the session service's scope, not in a ViewModel. `SosViewModel` becomes a thin adapter or is replaced.

`Inactive -> SafetyCheckRequested -> SosActive -> Resolved`, with `Inactive -> SosActive` for confirmed triggers. Write the transitions as a pure function `(state, event, now) -> state + effects` and test every edge.

When SOS becomes active, produce three cards:

- **For me.** Choose 3 to 5 steps from a fixed, reviewed list of actions keyed by situation (lost, followed, vehicle, medical, harassment, other). On-device AI may pick the situation key from her description; with no AI, use keyword matching, defaulting to "other". Add the pack's emergency number and `SafePlacePicker`'s pick with its reason.
- **For my contacts.** Reuse `SosMessageWriter` and `SosPrompt`. Fix the hard-coded "Noa" and "Call her now": add a small profile (name, and the pronoun she chooses, defaulting to her name with no pronoun). The message carries her description, location as coordinates plus a maps link, the fix's time, and what she wants contacts to do.
- **Show someone nearby.** Pick the best-matching reviewed phrase from `pack.localPhrases`, shown large. No free translation offline. When online, a custom sentence may be translated with `PREFER_IN_CLOUD`, labelled "machine translated".

**Delivery.** Extend `SosDispatcher` and `SmsSender` to use sent and delivery `PendingIntent`s so `Sent` and `Delivered` are reported only when the radio confirms them. With no signal the message is `SavedOnPhone` then `WaitingForSignal`, persisted in an outbox modelled on `PhotoOutbox` and `OutboxSender`, and flushed by `ConnectivityWatcher` plus a cellular-signal check. SMS needs cell signal, not data; with neither, nothing sends, and the UI must say so. Leave `PushSender` stubbed.

**Ongoing updates.** While `SosActive`, send contacts a location update when she has moved more than 200 m or 5 minutes have passed, whichever comes first, and at most one SMS every 2 minutes. If updates queued while offline, send one message on reconnect with the latest fix and the count of points recorded, not a flood. Keep a local breadcrumb trail (last 200 fixes). Below 15% battery, send one "battery low, last known location" update.

**End.** "I'm OK" asks for confirmation, moves to `Resolved`, tells contacts the session ended, stops updates and the microphone.

## 7. Input: activation, Safe Walk and listening

Create `features/session/` (the foreground service), `features/activation/`, `features/safewalk/` and `features/listening/`.

**Session service.** `SafetySessionService`, foreground types `location|microphone`, started only from a visible screen. It owns location updates, the listening pipeline and the `IncidentEngine`. Add the manifest permissions and types it needs, `POST_NOTIFICATIONS`, and `RECORD_AUDIO`, and explain each in `PermissionsStep`. Its notification is the lock-screen surface: neutral wording by default ("Beacon is on"), with "I'm OK" and "SOS" actions. On Android 16 and later, upgrade it to a promoted Live Update behind an SDK check; only raise `compileSdk` to 36 if the build stays green. iOS is out of scope; note Live Activities in the README roadmap.

**Ways to start an SOS.**

1. **Hold for SOS** on Home (the red button in the mockup). Require a press of about 1.5 seconds with a visible fill, so it can't fire from a pocket; also reachable with TalkBack.
2. **Quick Settings tile, "Beacon · Hold to talk"** (onboarding mockup 5). Tapping the tile opens a listening screen in the app, which brings the app to the front, so the microphone and Gemini Nano are allowed. She says one sentence. A keyword match plus an `ONLY_ON_DEVICE` intent check decide: danger ("Someone's following me") opens the SOS screen with her words as the description and the contact message already drafted; a question ("How do I get to my hostel?") opens Ask Beacon with that question. If the two disagree or nothing is heard, open the SOS screen, never silently drop it. Android tiles respond to a tap, and a long press normally opens the app's settings, so check whether a true hold-to-talk on the tile itself is possible; if not, keep the tap and change the label to "Tap to talk" and report it. Build this before the widget.
3. **Home-screen widget** with a neutral name and icon that opens the same listening screen.
4. **Ask Beacon.** If a question she types or says in Ask Beacon matches the danger keywords or the intent check, show a large "Send SOS" button at the top of the answer, prefilled with her words. Never send from Ask Beacon on its own.
5. Voice shortcut (stretch). A static app shortcut with a deep link (`homeward://sos`). Check the current Assistant and Gemini documentation for whether a spoken shortcut name can still launch it before spending time here. The demo must not depend on it.
6. Safe phrase. She sets a phrase in onboarding (for example "I want pepperoni pizza"). While a session is running, hearing it starts an SOS wherever she is, including inside a safe zone. Match it deterministically on the transcript (normalised, tolerant of small recognition errors), never with AI.

**Safe Walk.** She starts a session, optionally with a destination and expected arrival time. Trusted areas are user-defined plus the pack's Safer zones. Add a saved **home base** (her hostel or hotel, set in onboarding or from the map) since the mockups use it everywhere: tapping "Way to my hostel" on Home answers in Ask Beacon and offers "Start Safe Walk home" with the home base as destination.

**Listening modes inside a session.**

- `PhraseOnly` inside a trusted area: transcribe, match the safe phrase, discard everything else immediately.
- `Full` after leaving a trusted area: transcribe and score as below.
- `Off` when no session is running, when she pauses it, or when SOS has been resolved.

Use an on-device speech recogniser (ML Kit GenAI Speech Recognition in basic mode, or the platform on-device `SpeechRecognizer`; both need API 31, so gate by SDK and fall back to no listening below it). Gate the recogniser with a cheap voice-activity check so it is not running on silence. Audio is never written to disk and never leaves the phone. Keep at most the last 90 seconds of transcript in memory. Put the recogniser behind an interface so tests and the demo can feed it text.

**Risk scoring (pure logic, `RiskScorer`, fully unit-tested).** Points are added per event and expire after 5 minutes.

| Signal | Points |
|---|---|
| Her distress words: "help", "let me go", "stop the car", "leave me alone", "don't touch me", plus the pack's local-language equivalents | 3 |
| Threat or coercion words from anyone: "give me your phone", "get in", "don't scream", "be quiet" | 3 |
| Unease: "where are we going", "this isn't the way", "I'm lost", "I want to get out" | 2 |
| Inside an Avoid zone during its risky hours | 2 |
| Within 250 m of one and approaching (`ApproachDetector`) | 1 |
| More than 300 m off the Safe Walk route, or moving away from the destination for 3 minutes | 2 |
| On a walking session but moving faster than 25 km/h for 30 seconds | 2 |
| Stopped for 5 minutes outside any trusted area between 22:00 and 05:00 | 1 |
| Past expected arrival by 10 minutes, or a scheduled safety check missed | 3 |

- Score 3 or 4: quiet safety check. One gentle vibration, "Are you OK?" on the notification, 60 seconds to answer.
- Score 5 or more, or two 3-point speech signals within 60 seconds: urgent safety check. Full-screen prompt (check `canUseFullScreenIntent()`, fall back to a heads-up notification), 30 seconds.
- "I'm OK" clears the score and suppresses new safety checks for 10 minutes. "I need help" starts an SOS.
- No answer to an urgent safety check: start an SOS with `userConfirmed = false`. Contacts get a fixed template: her name, "did not respond to a safety check", the time, last location and its age, and the trigger reasons in plain words. It never states that a crime is happening.
- No answer to a quiet safety check: repeat once as urgent.

**Where Gemini Nano comes in.** When a safety check or SOS screen is on top, send the transcript window and the trigger reasons to an `ONLY_ON_DEVICE` model and ask for one of `SAFE | UNCLEAR | UNSAFE`, a situation key, and a one-sentence summary that quotes only what was said. Parse defensively; on any failure keep the rule-based result. The model may shorten a countdown or pre-fill her description. It may never cancel a safety check, lower a score or send anything. Only she can stand an alert down.

## 8. Offline pack and tracking

The pack is two things with different sizes, so give them different radii.

- **Data (places, zones, numbers, phrases):** small JSON, cheap to store. Download with an adaptive radius: start at 5 miles, then 10, 20 and 30, stopping when the pack has at least 40 places including one police station and one hospital. Dense cities stop early; rural areas reach 30 miles. Replace `out center 200` in `OverpassQuery` so results are not cut off arbitrarily; fetch, then keep the nearest 500. Add `radiusMeters`, `centerLat`, `centerLng` and `placeCount` to `SafetyPack` with defaults so saved packs still load.
- **Map tiles:** keep the existing small pre-save and the 30-day purge. A 30-mile radius at zoom 10 to 16 is about 31,000 raster tiles (roughly 450 MB); adding zoom 17 makes it about 123,000 (roughly 1.8 GB), and the providers forbid it. Draw places and zones as overlays so the map is still useful where street tiles are missing, and show the pack's coverage circle. Record in the plan, as a follow-up and not for this deadline, the option of a self-hosted vector extract (PMTiles with MapLibre) to get wide-area offline maps in tens of megabytes.
- **Refresh:** WorkManager job, unmetered network and battery not low. Rebuild when she is more than half the pack radius from its centre or the pack is over 7 days old. Show pack age and size in the UI and let her delete it. Let her download a pack for a destination before she travels.
- **Tracking:** put location behind one interface with sampling tiers. No session: no updates. Session inside a trusted area: every 60 seconds or 50 m. Outside: every 10 seconds or 10 m. SOS active: every 5 seconds. Drop to the slowest tier while stationary. GPS works without data but costs the most battery, so never leave the fast tier running after a session ends; add a hard 8-hour session cap with a reminder.

## 9. Display

**Design reference.** The Figma file is "Beacon v2". Its screens are exported to the repo, and they are the source of truth for layout, hierarchy, copy and visual style:

| Mockup (`docs/beacon-demo/img/`) | Screen | In code |
|---|---|---|
| `1.png`, `2.png` | Opening story: the night without Beacon, then with it | `onboarding/StoryStep.kt`, `StoryMap.kt` |
| `3.png` | Welcome | `onboarding/WelcomeStep.kt` |
| `4.png` | Who should hear from you (contacts, "Add my location to I'm OK") | `onboarding/ContactsStep.kt` |
| `5.png` | One press, even in your pocket (Quick Settings tile) | not built |
| `6.png` | Getting Rio ready for when you're offline | `onboarding/GetReadyStep.kt` |
| `7.png` | Home: map, Ask Beacon box, two suggested questions, nearest place, I'm OK, Police, Hold for SOS | `home/` |
| `8.png` | Ask Beacon answer | `ask/AskBeaconScreen.kt` |
| `9.png` | SOS sent | `sos/SosSentScreen.kt` |

`docs/beacon-demo/index.html` is a clickable version of these screens. `docs/walkthrough/img/` holds emulator screenshots of what is built now; compare against them to see what already matches.

Before building or changing any screen, open its mockup. Use the existing tokens and components: `design/Colors.kt` (warm paper background, ink text, blue primary, red only for SOS, the police call and red zones, green for OK and delivered), `design/Type.kt` (Sora for headings, Inter for body), `WhiteCard`, `PrimaryButton`, `IconCircle`, `ProgressDots`. Add new components to `design/components/` rather than styling one-off. Lapa landmark pictures come from `docs/design/landmarks/make_landmarks.py`; never hand-edit `res/drawable/landmark_*.xml`.

**Where the mockups and the rules disagree, the rules win.** Make these specific changes and list them in your report:

- **SOS sent (`9.png`).** "Mom, Dad and Alwis know" with a green tick is only true once those messages are confirmed. Today `SosSentScreen` counts a contact as reached when the send call didn't throw. Show the green tick and "X knows" only for `Delivered`; otherwise use the same layout with honest wording ("Saved on your phone. It sends when you have signal", "Sent to Mom, waiting for delivery"), per contact.
- **SOS sent is also the active-session screen.** Below the mockup's cards, in the same style: the "Show someone nearby" phrase (`LocalPhrasesCard`), when the last location update went out, and a quiet "I'm safe now, end SOS" button. The mockup's "Call police 190" and "Walk to 5º DP police station" cards are the "For me" card; add the 1 to 3 checklist steps above them.
- **Contacts (`4.png`).** "Only when you tap it. Beacon never tracks you." stops being true once SOS sends location updates and Safe Walk reads location. Change it to something accurate, for example "Only when you tap it. Beacon shares where you are only in an SOS or a Safe Walk you start."
- **Get ready (`6.png`).** "74 safe places saved": say "places to get help". The rest of the screen stays.
- **Ask Beacon (`8.png`).** The answer shows walking directions and "Your hostel is Rua Joaquim Silva 99, from your booking". There is no routing engine and no booking import. The home base address comes from what she saved. Step-by-step directions may only come from a route stored in the pack (for the Lapa demo, add one hand-checked route to `DemoRioPack`); elsewhere, answer with the direction and distance to the home base and which red zones lie between, and say it is not turn-by-turn. Replace "from your booking" with "from what you saved". Keep the cop, the follow-up box and "From your Rio pack, saved on wifi."
- **Home (`7.png`).** The drawn route to "Your hostel" may only appear when it comes from that stored route. Add, without crowding the sheet, a small status line for pack age and whether a Safe Walk is on.

**Screens with no mockup yet.** Build these in the same style (white cards on paper, one full-width blue button at the bottom, red only for SOS) and say so in your report:

- **SOS compose:** one description box with a mic button, quick picks (Being followed, Feel unsafe, Hurt, Lost, In a vehicle), then the editable contact message with an "On device" or "Cloud" badge from `inferenceSource`, and Send.
- **Talk screen** (opened by the tile and widget): a large pulsing mic, "Say what's happening", her words appearing as she speaks, and a Cancel.
- **Safety check:** "Are you OK?", two very large buttons ("I'm OK", "I need help") and a visible countdown. Usable with one hand in the dark; full-screen over the lock screen when allowed.
- **Safe Walk setup:** destination (home base by default), arrival time, and the trusted areas on the map.
- **Onboarding additions:** home base, safe phrase (with a "say it now" test), microphone and notification permissions in `PermissionsStep`, and a practice SOS that sends nothing. Keep the segmented progress bar and update its count.
- **Lock-screen notification:** neutral ("Beacon is on"), with I'm OK and SOS actions. Nothing alarming on the lock screen by default.
- **Trusted contact:** contacts receive SMS. Make the messages read well in order (alert, updates, ended), in the style of the message card in `9.png`. An in-app or web contact view is a stretch.

Keep 48 dp minimum touch targets.

## 10. Hybrid inference map (make this visible to judges)

| Job | Mode | Why |
|---|---|---|
| Research a city for the pack | Cloud only, with Google Search | Needs the web |
| Write the SOS from what she typed | `PREFER_ON_DEVICE` | Works offline; cloud fallback on phones without Nano; she is about to send this text anyway |
| Ask Beacon: answer from the saved pack (exists) | `PREFER_ON_DEVICE` | Works offline; answers only from pack facts |
| Tile and widget: is this sentence danger or a question? | `ONLY_ON_DEVICE`, keyword fallback | Her words stay on the phone; ties go to SOS |
| Judge an overheard conversation | `ONLY_ON_DEVICE` | What the microphone heard never leaves the phone; fallback is the rule scorer |
| Pick situation and checklist | `ONLY_ON_DEVICE` | Same input as above |
| Translate a custom sentence for a stranger | `PREFER_IN_CLOUD` | Better quality online; on-device when offline |
| Read a safety photo, explain a zone | existing | Unchanged |

Add the two new model instances in `AiModels.kt`. Put this table, extended with the iOS and Web rows from section 10A (family-view summary, trip planner, Ask Beacon on each platform), in `ARCHITECTURE.md` and the README, with one column per platform.

## 10A. Shared backend, iOS and Web

### Stack per platform

| Platform | Stack | Why this one |
|---|---|---|
| Android | Kotlin, Jetpack Compose, `firebase-ai` + `firebase-ai-ondevice` (existing) | Gemini Nano through AICore; direct SMS; foreground services; Quick Settings tile |
| iOS | Swift 6, SwiftUI, iOS 26 SDK (deployment target iOS 18.1, the first with Apple Intelligence; Foundation Models features behind `if #available(iOS 26, *)`), Firebase Apple SDK 12.13 or later **through Swift Package Manager**, MapKit, ActivityKit, App Intents, WidgetKit, Speech | Firebase's iOS hybrid inference runs on Apple's Foundation Models and is only available through SPM; Live Activities and the Action Button are the iOS discreet surfaces |
| Web | TypeScript, Vite, Firebase JS SDK 12.5 or later (`firebase/ai`, Firestore, Auth, App Check), MapLibre GL JS, Firebase Hosting | On-device inference uses Chrome's built-in Prompt API (Gemini Nano), desktop Chrome 139 or later; static hosting gives judges a URL |
| Backend | Firebase Auth (anonymous), Cloud Firestore with offline persistence, App Check on every client, Firebase Hosting | Works on the free Spark plan; no Cloud Functions needed |

Do not use Flutter, React Native or any cross-platform UI framework: none of them exposes the native hybrid on-device APIs. Share **data and behaviour**, not UI code.

### Repository layout

Keep the Android app where it is. Add:

```
shared/
  schema/          JSON Schemas: safety-pack, incident, location-update, share
  fixtures/        rio-lapa-pack.json (exported from DemoRioPack), demo-incident.json
  test-vectors/    JSON input/expected-output cases for the pure logic (zones, place picker, risk scorer, phrase matcher, message templates)
  prompts/         the pack research prompt and Ask Beacon prompt text, with {placeholders}
ios/               Xcode project "Beacon" (app, widget/Live Activity extension, unit tests)
web/               Vite project (family view, trip planner)
firebase/          firebase.json, firestore.rules, firestore.indexes.json, rules tests
```

Every platform's unit tests load `shared/test-vectors/` and must produce the same outputs, so the three ports of `ZoneChecker`, `SafePlacePicker`, `ApproachDetector`, `RiskScorer`, the phrase matcher and the message templates behave identically. Android's existing tests stay; add a test that runs the vectors.

### Shared backend (Firestore)

The phones already work with no internet. Firestore is the layer that connects platforms when there is a connection.

- `trips/{tripId}`: owner uid, traveler display name, city, pack reference, created time. Owner-only read and write.
- `trips/{tripId}/incidents/{incidentId}`: phase, activation method, her description, trigger reasons, created and resolved times. Owner writes.
- `trips/{tripId}/incidents/{incidentId}/updates/{id}`: lat, lng, taken-at, accuracy, battery. Owner writes.
- `packs/{packId}`: a safety pack built on the web planner or a phone; owner-only.
- `shares/{shareId}`: `shareId` is a random 128-bit id. Contains the trip id and a contact label. Rules allow `get` but never `list`, so knowing the link is the permission. A share can read its trip's incidents and updates and nothing else, and can be revoked.
- Clients sign in anonymously. Enable Firestore offline persistence on all three clients so writes made with no signal queue and sync later; show that state honestly in the UI ("Saved on your phone").
- Write `firestore.rules` and rules tests with the Firestore emulator (`@firebase/rules-unit-testing`). Tests prove: no one can list shares; a share cannot read another trip; a contact cannot write.
- Android: when an SOS starts, also write the incident and its updates to Firestore, and add the family link (`https://<hosting-domain>/f/<shareId>`) to the SMS. SMS stays the path that works with no data. `PushSender` stays stubbed; the family web view replaces push.
- App Check is required by Firebase AI Logic and must be on for every client: Play Integrity on Android, App Attest on iOS, reCAPTCHA Enterprise on web, with debug providers in debug builds. Read debug tokens from local config, never commit them.
- Deploying (`firebase deploy --only hosting,firestore`) publishes a public site: prepare it and run it only if the person running you said deploys are allowed. Otherwise leave the exact command in the report.

### Web (desktop Chrome)

Two parts, one Vite app, light Beacon v2 styling (same colour tokens and Sora/Inter fonts; the OFL licences are in `docs/licenses/`).

1. **Family view, `/f/{shareId}`.** What a trusted contact opens from the SMS. A live map (MapLibre, standard OSM tiles viewed normally, credit shown) with her latest position, its age and the trail; a timeline of the alert, each update and the end; the pack's police and embassy numbers for her city as large `tel:` links. A "What's happening and what should I do?" panel written by **`PREFER_ON_DEVICE`** (Gemini Nano in Chrome) from the incident data and pack facts only, so her location trail can be summarised without leaving the contact's computer; cloud fallback in other browsers; shows an "On this computer" or "Cloud" badge. It must never claim a crime is happening, and must fall back to a fixed template. Optional browser notification while the tab is open.
2. **Trip planner, `/plan`.** The traveler, before leaving, enters a destination on her laptop. The web app builds the safety pack with the cloud model and Google Search (same prompt as `shared/prompts/`) plus OpenStreetMap places within the adaptive radius (section 8; one Overpass query per build), shows it on a map, lets her review it, and saves it to `packs/`. A six-digit pairing code or QR code lets her phone (Android or iOS) download it on wifi. "Ask Beacon about this city" runs `PREFER_ON_DEVICE` on the saved pack.
- Chrome's Prompt API needs a user gesture before the model is created and a one-time model download: create the model on the first click, show download progress, and keep everything usable while it downloads.
- A `/demo` route loads `shared/fixtures/` (a seeded trip, a replayed incident in Lapa) so judges can see the whole family view without phones. This is the hosted URL for the submission.
- Tests with Vitest for the shared logic and the summary-template fallback; a Playwright smoke test for `/f/` and `/plan` against the Firestore emulator.

### iOS (iPhone with Apple Intelligence; the team's test phone is an iPhone 15 Pro)

The traveler app, matching the Android feature set as closely as iOS allows, in the Beacon v2 design (port `design/Colors.kt` and `Type.kt` to a SwiftUI theme; reuse the landmark SVGs and Figma screens in section 9).

- **AI.** One place that creates the models (mirror `AiModels.kt`): hybrid `PREFER_ON_DEVICE` (Foundation Models, Gemini fallback) for the SOS message, Ask Beacon and the talk intent check; cloud-only with Google Search for pack research. On-device inference on iOS only runs while the app is in the foreground, same as Android: background detection is rule-based (ported `RiskScorer`), and the model runs once a safety check or SOS screen is open. Show the inference source badge.
- **Onboarding:** story, contacts with `CNContactPickerViewController`, home base, safe phrase, permissions, and "get ready" that downloads a pack (from the pairing code or by building one) and checks Apple Intelligence availability, explaining what still works without it.
- **Home:** MapKit with the pack's zones and places as overlays (they still show when tiles are not cached), the bottom sheet from `7.png`, Ask Beacon, I'm OK, Police, Hold for SOS.
- **SOS.** iOS does not let apps send SMS silently. Prefill `MFMessageComposeViewController` with all contacts and the message, so she sends with one tap; say so on screen. At the same moment write the incident to Firestore (queues offline) and include the family link. While SOS is active, location updates go to Firestore (Always or When In Use location with background updates and the location background mode); contacts follow them in the family view. Be honest in the UI about which path worked.
- **Discreet activation, iOS-native:** an App Intent "Beacon SOS" that she can put on the **Action Button** (iPhone 15 Pro and later) and in **Control Center** (a `ControlWidget`), and App Shortcuts phrases for Siri (check current App Intents rules on phrases; Siri phrases must include the app name, so the safe phrase stays in-app). These open the talk screen or start the SOS flow.
- **Live Activity and Dynamic Island** for an active Safe Walk or SOS: neutral by default ("Beacon is on"), with interactive "I'm OK" and "SOS" buttons (App Intents). This is the lock-screen surface.
- **Safe Walk and listening (Phase 6 stretch):** the same modes as Android, using `SFSpeechRecognizer` with `requiresOnDeviceRecognition` (or `SpeechAnalyzer` on iOS 26) while a session she started is running, with the audio background mode; rule-based scoring; safety checks as time-sensitive local notifications with actions.
- **Tests:** XCTest for the ported logic against `shared/test-vectors/`; build with `xcodebuild` for the simulator. Signing: use the person's free Apple ID team for their own phone; note in the README that TestFlight needs a paid developer account.

## 11. Order of work, tests and done

1. **Phase 1, Android vertical slice:** contracts, `IncidentEngine`, Hold for SOS, SOS compose, the SOS sent screen with honest delivery status and outbox, the three cards, active-session updates, resolved. Also create `shared/` with the schemas, the Rio fixture and the first test vectors. This must demo end to end before anything else starts.
2. **Phase 2, backend and family view:** Firestore model, rules and rules tests, anonymous auth and App Check on Android, Android writes incidents and updates and puts the family link in the SMS, the web family view and `/demo`. After this phase the cross-platform story already works: an SOS on Android appears live in desktop Chrome.
3. **Phase 3, Android session and input:** session service, lock-screen notification, adaptive pack radius, refresh job, tracking tiers, talk tile and talk screen, widget, home base, Safe Walk, listening modes, `RiskScorer`, safety check, safe phrase, the SOS button in Ask Beacon.
4. **Phase 4, iOS core:** project, theme, onboarding, pack download by pairing code, Home with MapKit, Ask Beacon, SOS with message compose and Firestore, ported logic passing the shared vectors.
5. **Phase 5, platform extras:** web trip planner and pairing; iOS Action Button, Control Center control, Live Activity; Android Nano verdict on safety check, badges, onboarding additions, the stored Lapa route, Live Update, voice shortcut.
6. **Phase 6, stretch:** iOS Safe Walk, listening and safety checks; web notifications.
7. **Phase 7, submission:** README with a section per platform (how Firebase AI Logic is used on each, setup, limitations, what was built during the submission period), `ARCHITECTURE.md`, debug demo modes (recorded GPS route and scripted transcript on both phones, `/demo` on web), a three-minute demo script in `docs/` that shows all three platforms in one story (plan the trip in Chrome, walk in Lapa on Android, SOS, Mom watching in Chrome, the same flow on iPhone with the Dynamic Island), a release APK, and the hosted URL. Refresh `docs/beacon-demo/` and `docs/walkthrough/`. Confirm the Apache-2.0 licence shows in the repo's About section and App Check is on for all three apps.

If time runs short, drop phase 6 first, then the parts of phase 5 that are not visible in the demo script. Never skip phase 7.

Tests: every pure-logic file has unit tests (state machine transitions, scorer thresholds and expiry, phrase matcher, talk-tile intent keywords, adaptive radius, update throttling, message templates, delivery wording on the SOS sent screen). `./gradlew test` and `assembleDebug` must pass at the end of every phase; from the phase that adds them, so must the web tests and build (`npm test`, `npm run build`), the Firestore rules tests, and the iOS tests and simulator build.

**Run all seven phases in one go.** Do not stop for approval between phases. At the end of each phase, commit, append a short phase report to `docs/specs/2026-11-25-beacon-full-app-plan.md`, and continue. Stop early only if the build or tests are red and you cannot fix them, or a decision would remove a feature described here.

Each phase report says: what you verified and how (unit test, build, emulator), what still needs real hardware to verify (Android: a phone with Gemini Nano and a SIM for on-device inference, SMS, microphone, the tile, Live Updates; iOS: an iPhone with Apple Intelligence for Foundation Models, message compose, Action Button, Live Activity; Web: desktop Chrome with the on-device model downloaded), which facts in section 4 you could re-check, and what you cut. At the very end, write a single list of everything a person must test on real devices, per platform, in the order of the demo. If something cannot be built as written, say so and propose the nearest thing that can; do not fake it with a hard-coded result outside demo mode.

## 12. Sources for sections 4 and 10A

- https://firebase.google.com/docs/ai-logic/hybrid/android/get-started
- https://firebase.google.com/docs/ai-logic/hybrid/android/configuration-options
- https://developers.google.com/ml-kit/genai
- https://developers.google.com/ml-kit/genai/speech-recognition/android
- https://developer.android.com/develop/background-work/services/fgs/service-types
- https://developer.android.com/about/versions/12/foreground-services
- https://developer.android.com/develop/sensors-and-location/location/battery
- https://developer.android.com/develop/ui/compose/notifications/live-update
- https://operations.osmfoundation.org/policies/tiles/
- https://wiki.openstreetmap.org/wiki/Overpass_API
- https://firebasehybridaihackathon.devpost.com/
- https://firebase.google.com/docs/ai-logic/hybrid/ios/get-started
- https://firebase.google.com/docs/ai-logic/hybrid/web/get-started
- https://developer.chrome.com/docs/ai/get-started
- https://developer.chrome.com/docs/ai/prompt-api
