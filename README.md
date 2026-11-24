# Beacon

**Safety help that works with no signal.** Built for #BuildHybridAI 2026 (Firebase AI Logic).

After the army, my sister went to India with no plan, no local numbers and often no signal. Nothing happened,
but if it had, she couldn't have reached anyone. Beacon is for that moment, for her and for the family at home.

> Find My tells your mom where you are. Beacon tells her what's happening and what to do.

## What it does
- **Red-zone warnings on the walk home (offline):** the map buzzes when you head toward a red area at night,
  says why, and shows the nearest open safe place. In Lapa, Rio, the map is an illustrated one; everywhere
  else it is a real street map saved to your phone.
- **Ask Beacon (on-device AI, cloud fallback):** a chat that answers from the city's safety pack: "What's the
  police number?", "Is this area OK now?", "Where's a safe place?". It only uses saved facts and never
  guesses a phone number.
- **SOS by text, with no signal (on-device AI):** type or tap what's happening. Gemini Nano on the phone writes
  a clear SOS with your location. You check it, then it goes out by SMS. "I'm OK" lets family know you got home.
- **Safety pack (cloud):** when you land, Gemini with Google Search researches the city: police and ambulance
  numbers, your embassy, emergency phrases, and green / yellow / red areas by time of night. Safe places (police,
  hospitals, pharmacies, 24h gas stations) come from **OpenStreetMap**, so they're real, not AI guesses.
  Everything is saved on the phone.
- **Safety photos (on-device AI):** snap a taxi plate; the phone reads it offline and sends it to family when
  you're back online.
- **One-tap local police** with the right number for the country.

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
5. Optional, for the Google Maps-like look: request a free key at carto.com/basemaps/apikey and add
   `CARTO_KEY=your_key` to `local.properties` (git-ignored). Without it the app uses plain OpenStreetMap tiles.

The package name is still `app.homeward`, the project's first name. The app is called Beacon on the phone.

## Status
Working: opening story, setup (contacts, permissions, getting ready offline), safety pack build and offline storage,
illustrated Lapa map and offline street map, live red-zone warning with vibration, safe place picker, Ask Beacon,
on-device SOS writing, SMS sending, "I'm OK" check-in, safety photo reading and sending when back online, police call,
contacts editing.

Not built yet: push between phones (needs a Cloud Function; SOS goes by SMS until then), walking route around red zones.
On-device Gemini Nano has so far been tested only on an emulator, which uses the cloud fallback.

Design: Figma file "Beacon v2". Team: David Frumgarzts (design), Alwis Lim and Julia (tech).

Map and safe places: © OpenStreetMap contributors (ODbL), credited on the map screen. Standard OpenStreetMap tiles;
streets you have viewed stay available offline.

## License
Apache 2.0
