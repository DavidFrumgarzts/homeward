# Homeward

**Safety help that works with no signal.** Built for #BuildHybridAI 2026 (Firebase AI Logic).

After the army, my sister went to India with no plan, no local numbers and often no signal. Nothing happened,
but if it had, she couldn't have reached anyone. Homeward is for that moment, for her and for the family at home.

> Find My tells your mom where you are. Homeward tells her what's happening and what to do.

## What it does
- **Safety pack (cloud):** when you land, Gemini with Google Search researches the city: police and ambulance
  numbers, your embassy, emergency phrases, safe places, and green / yellow / red areas by time of night.
  It is saved on the phone.
- **Safety map (offline):** a Google Maps-style map of the city saved to your phone. While you walk, it buzzes
  when you head toward a red area at night, says why, and shows the nearest open safe place.
- **Offline SOS (on-device AI):** type or tap what's happening. Gemini Nano on the phone writes a clear SOS with
  your location. Sent by SMS when there's no data.
- **Safety photos (on-device AI):** snap a taxi plate; the phone reads it offline and sends it to family when
  you're back online.
- **One-tap local police** with the right number for the country, and emergency phrases in the local language
  to show people nearby.

## How it uses Firebase AI Logic
Hybrid inference with `InferenceMode.PREFER_ON_DEVICE`: everything that must work offline runs on Gemini Nano;
the city research runs in the cloud with Google Search grounding. See [ARCHITECTURE.md](ARCHITECTURE.md).

## Run it
1. Install [Android Studio](https://developer.android.com/studio) and open this folder (or build from the terminal with `./gradlew assembleDebug`, Java 17).
2. Create a Firebase project, add an Android app with package `app.homeward`, enable **Firebase AI Logic**
   (Gemini Developer API) and **App Check**, and download `google-services.json` into `app/` (it is git-ignored).
3. Run on a phone with Gemini Nano (Pixel 9 or newer, recent Samsung flagships) to see on-device AI.
   Other phones fall back to the cloud.
4. App Check: copy the debug token from Logcat into Firebase console > App Check > Manage debug tokens.

## Status
Working: safety pack build + offline storage, offline city map, live red-zone warning with vibration, safe place picker, on-device SOS
writing, SMS sending, safety photo reading + sending when back online, local phrases, police call. Not built yet: push between phones (needs a Cloud
Function), walking route around red zones, contacts editing screen.

Design: Figma file "Homeward – safety app screens". Team: David Frumgarzts, Alwis Lim, Julia.

Map: CARTO Voyager tiles, © OpenStreetMap contributors © CARTO (free for non-commercial use with credit).

## License
Apache 2.0
