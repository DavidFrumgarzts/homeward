# Safety app: first screens and code structure

> **Updated Nov 25, 2026.** Two decisions below were reversed by the full-app plan (`2026-11-25-beacon-full-app-plan.md`):
> 1. **Live location updates to contacts are now in scope**, but only while an SOS she started is active (after 200 m or 5 minutes, at most one text every 2 minutes). Nothing is shared outside an SOS, except an "I'm OK" message when she turned location on for it.
> 2. **The dark navy theme is replaced** by the warm, light Figma "Beacon v2" look in `design/Colors.kt` (paper background, ink text, blue primary, red only for SOS, the police call and red zones).
>
> The app is called Beacon; "Homeward" remains the repo and package name. The rest of this document is kept as the record of the first design.

Working name: **Homeward** (placeholder, easy to rename).

## Why
David's sister went to India after the army with no research and often no signal. If something had happened, she had no local numbers and no way to reach home. The app gives the person in danger a way to get help with no signal, and gives family and friends peace of mind. It sits on top of Find My / Life360: they show *where* she is, we show *what's happening and what to do*.

## Goals for this step
- The app's first screen (home) and the SOS flow, designed in Figma, then built.
- A code layout where every file has one job, so a bug can be fixed by reading one or two small files.

## Non-goals (this step)
- Onboarding, the safety pack screen, safety photos, safe places, parent updates. They get their own screens next.
- Live location tracking (cut: users keep Find My / Life360 for the map). **Reversed, see the note at the top:** updates are sent during an active SOS.

## Anti-goals
- A screen that feels scary or busy. It must be calm for daily use and fast in a panic.
- Anything that needs more than one hand or more than two taps to send an SOS.

## Approaches (platform)
1. **Native Android: Kotlin + Jetpack Compose (picked).** Firebase AI Logic's on-device mode (Gemini Nano) is supported here, the app can send SMS automatically, and judges install it with a free APK.
2. Flutter / React Native: one codebase for both phones, but on-device hybrid inference isn't supported the same way, so the core feature would be at risk.
3. iPhone (SwiftUI): needs a Mac with Xcode, a $99 developer account and TestFlight review for judges.

## Screens
**Home**
- Top: status line: "You're OK · Local pack ready · Offline" (green dot), so she knows the app works without signal.
- Center: one large SOS button (thumb-sized, about 40% of the screen width).
- Below: two cards: **Safety photo** (camera icon) and **Nearest safe place** (e.g. "24h gas station · 300 m").
- Bottom: trusted contacts row (avatars), so she can see who will get the SOS.

**SOS: say what's happening**
- Text box with mic button: "What's happening?" Quick chips: *Being followed*, *Feel unsafe*, *Hurt*, *Lost*.
- On-device AI turns it into a clear message. She sees the draft with her location and taps **Send** (one tap).

**SOS: sent**
- "Sent to Mom, Noa, Alwis" with how it went: *push* or *SMS (no data)*.
- Big **Call local police (112)** button and the nearest safe place with directions.

## Look
- Dark theme by default (night use, battery, discreet), high contrast. **Reversed, see the note at the top.**
- Colors: deep navy background, warm coral-red for SOS only, calm green for "OK" status, soft white text.
- Type: Inter. Large sizes; nothing under 15pt.
- Big touch targets (48dp minimum, SOS much bigger).

## Code layout (Android)
One module, organized by feature. Rules:
- **One job per file**, aim for under 150 lines.
- Every folder has a short `README.md` listing its files and what each does, so Claude Code can find the right file without reading everything.
- `ARCHITECTURE.md` at the root maps each feature to its folder.
- Screens never call Firebase or Android APIs directly. They go through small interfaces in `core/`, so each piece can be tested and swapped with a fake.

```
app/src/main/java/app/homeward/
  MainActivity.kt          entry point, sets up navigation
  navigation/              routes and the nav graph
  core/ui/                 theme (colors, type), shared components (BigButton, StatusPill, Card)
  core/ai/                 HybridAi interface + Firebase AI Logic implementation, prompts
  core/location/           current location (works offline via GPS)
  core/messaging/          SOS senders: push, SMS fallback, chooser
  core/contacts/           trusted contacts storage
  feature/home/            HomeScreen, HomeViewModel, home UI pieces
  feature/sos/             compose message, review draft, sent screens + ViewModel
```

## Lessons from past winners (added after review)
From Trail (Best Hybrid, Chrome AI Challenge 2025), AAC Board AI (Most Helpful, 2025) and the Firebase Android hybrid docs:
- **First launch downloads the on-device model.** The SDK won't download it on demand (`FirebaseAIOnDevice.checkStatus()` / `download()`), and an SOS with no signal can't fall back to the cloud. Onboarding must finish the download.
- **"On device / Cloud" badge** on every AI result, from `response.inferenceSource`, so judges see hybrid working. Home also shows connection status.
- **The AI only rewrites, never invents.** AAC Board AI dropped free-form generation because ~20% of outputs were nonsense. Our on-device AI turns her words into a clear SOS; she always sees the draft; numbers and places come from verified data only.
- **Demo uses a recorded GPS route** (Trail simulated GPS), so the "being followed" scene doesn't need staging.
- **Tests** for the pure-logic files (message building, sender choice), plus a README and this architecture doc.
- Setup facts: `firebase-ai` + `firebase-ai-ondevice` (beta, not in the BoM) + App Check; min API 26; `InferenceMode.PREFER_ON_DEVICE`; on-device images must be inline JPEG/PNG; Google Search grounding is cloud-only (safety pack is built in the cloud).

## Left to the builder
- Exact Firebase AI Logic dependency versions and on-device setup (check current docs).
- Icon set (Material Symbols is fine).

## Blockers to fix before code can run
- This Mac has no Java or Android Studio, so code can be written but not compiled or run yet. Install Android Studio.
- Someone needs a Pixel 9+ or recent Samsung with Gemini Nano to test on-device AI.
