# web

Beacon as a web page: the same look and features as the Android app, in plain HTML, CSS and JavaScript (no build step). One page, three addresses:

| Address | What it is |
|---|---|
| `/` | The traveler's app: story, setup, the drawn Lapa map, Ask Beacon, SOS and "I'm OK". |
| `/f/{shareId}` | The family view: what a trusted contact opens from the link in the SOS text. A live map, how old the last position is, what to do, the local emergency numbers, what happened. |
| `/demo` | The family view with a made-up incident replayed on a fast clock. No phones and no database needed. |

## Run it

```
python3 web/serve.py
```

Then open http://localhost:4173. Add `?reset` to start over. The family view is at `/demo` and `/f/<shareId>`.

- `serve.py` answers `/f/...` and `/demo` with the app, the way Firebase Hosting does. The plainer `python3 -m http.server 4173 --directory web` also works, with two limits: it cannot serve those two addresses (use `?demo` and `?f=<shareId>` instead, which work everywhere), and on a busy computer it sometimes drops some of the page's files.
- Against the Firebase emulators instead of the real project: from `firebase/` run `firebase emulators:start --only auth,firestore,hosting --project demo-beacon`, then open http://127.0.0.1:5005/?emu. `?emu` only works on localhost, uses a made-up project and keeps AI off. `node tests/seed-emulator.js` (from `web/`) puts the demo incident in the emulator and prints a family link.

## Files

- `index.html`: the empty page; `js/app.js` draws every screen into it.
- `styles.css`: colors, type and layout (same values as the Android app and Figma "Beacon v2").
- `serve.py`: the small local server above. Not uploaded.
- `js/app.js`: the traveler's screens, one function each (story, welcome, contacts, ready, home, ask, sos, sent), and the start: which address opens which page.
- `js/router.js`: pure logic. Turns an address into a page name. Add a page here (the trip planner at `/plan` is next).
- `js/map.js`: draws the Lapa map, the place badges and your green dot; turns taps and GPS into map spots.
- `js/pack.js`: the saved Rio pack (numbers, phrases, red zone, safe places) and the red-zone checks. A test checks it against `shared/fixtures/rio-lapa-pack.json`.
- `js/ask.js`: Ask Beacon. Builds the prompt for the AI; without AI, plain rules answer from the pack.
- `js/sos.js`: writes the SOS and check-in messages and makes the link that opens the messages app.
- `js/messages.js`: pure logic. Every text a contact can get, word for word the same as Android (`IncidentMessages.kt`). Coordinates, links and numbers are added here by code, never by AI.
- `js/prompts.js`: pure logic. The text of the AI prompts, the same as `shared/prompts/` (a test fails if they differ).
- `js/situation.js`: pure logic. Works out the kind of trouble from her words (same key words as Android).
- `js/incident.js`: saves the traveler's SOS to Firestore (trip, family link, incident, first update) so family can follow it.
- `js/firebase.js`: the only place that sets up Firebase: the app, App Check, anonymous sign-in, Firestore.
- `js/ai.js`: the only file that talks to AI (Firebase AI Logic, hybrid: on this computer in Chrome when it can, cloud otherwise). Every answer says where it ran.
- `js/family.js`: the family view screen. `js/familydata.js`: its live data from Firestore. `js/familymap.js`: its real-street map (MapLibre, OpenStreetMap tiles, credit shown). `js/timeline.js`: pure logic for ages, the trail and "what happened". `js/summary.js`: the "What's happening and what should I do?" panel.
- `js/demo.js`: replays `fixtures/demo-incident.json` for `/demo`.
- `js/html.js`: text made safe for HTML, and the AI badge. `js/cop.js`: the cartoon cop in the chat. `js/store.js`: remembers your name, contacts and trip in the browser.
- `fixtures/`: copies of `shared/fixtures/` (hosting only serves `web/`). A test fails when they differ; refresh with `cp shared/fixtures/*.json web/fixtures/`.
- `sw.js`: keeps a copy of the app's own files so the page opens with no signal. A test fails if a file in `js/` is missing from its list. It never saves map tiles.
- `firebase-config.example.js`, `appcheck-config.example.js`: how to make the two local settings files.
- `tests/`, `package.json`, `vitest.config.js`, `playwright.config.js`: tests only. Nothing they install is shipped or imported by the page.

## How it uses Firebase AI Logic (hybrid)

One model, `PREFER_ON_DEVICE`: Gemini Nano inside Chrome answers on this computer when it can, the cloud model (`gemini-3.5-flash-lite`) when it can't. Every AI answer carries a badge, **On this computer** or **Cloud**, taken from the answer's `inferenceSource`. No badge means no AI was used.

| Job | Without AI |
|---|---|
| Ask Beacon answers from the saved pack | Plain rules pick the saved fact |
| The SOS: rewrite her words into one or two clear sentences | Her own words in a fixed sentence |
| Family view: "What's happening and what should I do?", written from the incident only, so the location trail can stay on the contact's computer | A fixed, reviewed wording. Also used when the AI's answer names a crime she did not write, or contains a number that is not in the facts |

AI is called on events only (a question, a new update), never on a timer.

### Set up

1. **Config.** Copy `firebase-config.example.js` to `firebase-config.js` and paste the web app's config. It is git-ignored and never uploaded. On Firebase Hosting the page reads `/__/firebase/init.json` instead.
2. **App Check on localhost.** Firebase AI Logic refuses calls without App Check. Open the page, open Chrome's DevTools console, and click anything. A line appears: `Firebase App Check debug token: ...`. Paste that token in the Firebase console: App Check > Apps > the web app's menu > Manage debug tokens. Each browser profile prints its own token (or set `appCheckDebugToken` in `firebase-config.js` to share one). Until it is registered, AI calls fail (`exchangeDebugToken` 403, then 401) and the plain rules answer.
3. **App Check on the hosted site.** Create a reCAPTCHA Enterprise site key for the hosting domain (console > App Check > Apps > web app), copy `appcheck-config.example.js` to `appcheck-config.js` and paste the site key. Without it the hosted site works with no AI.
4. **Chrome's on-device model.** Desktop Chrome 139 or later. In `chrome://flags` enable `#prompt-api-for-gemini-nano-multimodal-input` (the one Firebase documents) and `#prompt-api-for-gemini-nano`; if your Chrome has `#gemma4-for-built-in-ai` ("Gemma 4 for Built-in AI"; Chrome 158 does), enable it too. Restart Chrome. The model downloads once, after your first click on a Beacon page; a small note at the bottom shows the progress and nothing waits for it. `chrome://on-device-internals` shows its state. Chrome needs about 22 GB of free disk space for it.

## Tests

```
npm install        # once
npm test           # unit tests, then browser tests on the Firebase emulators
```

- The emulators need Java: `export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` on this Mac. The browser tests use the Chrome that is installed.
- `npm run test:unit` (Vitest): the message templates and the situation picker against `shared/test-vectors/`, the prompts against `shared/prompts/`, the pack against the shared fixture, the family view's summary wording and its safety check, ages and the timeline, the demo replay, the router, the fixture copies and the service worker's file list.
- `npm run test:e2e` (Playwright): the traveler flow up to an SOS that reaches Firestore and the family page it creates; a family link with live updates and then turned off; an unknown and a broken link; `/demo`; and the app opening with no connection after one visit.
- `node tests/screenshots.js` retakes `docs/walkthrough/img/web-*.png` (see the top of that file).

## Differences from the Android app

- A web page can't send a text by itself. SOS and "I'm OK" open your messages app with everything filled in; you press send. Ending an SOS works the same way.
- A web SOS gives the family page its first position and, when she ends it, the end. The browser does not keep sending location updates.
- Without `firebase-config.js` there is no AI and no family page: answers come from plain rules over the saved pack, and the SOS has no link in it.
- A family link made on localhost points at localhost (`?f=...`). Links for real contacts come from the hosted site.
- Outside Lapa the map is a demo: tap it to walk. Your real position is only used inside Lapa, and in the SOS message.

## Beacon live, any city (`live/`)

The traveler app on a real street map, for wherever you are: https://homeward-6999c.web.app/live/ (locally http://localhost:4173/live/). The old `/ny/` address forwards here.
- Your city comes from your GPS position (OpenStreetMap's Nominatim names it; the last one is saved for offline). Until then the city is unknown: nothing is assumed.
- Emergency numbers by country (`js/emergency.js`; 112 where the country isn't listed, and the AI is told it wasn't checked).
- Police stations, hospitals and 24-hour pharmacies near you, from OpenStreetMap, saved for offline. A hand-made list of Manhattan precincts is used only in Manhattan when no server answers.
- Scan ("Is this legit?"): a photo is matched to one of the scams saved for your city (`js/cityscams.js`). New York has 32 researched scams built in (`live/js/nypack.js`), used only in New York. Every city, New York included, gets more once a day while online: Gemini with Google Search when the project's plan allows it, otherwise from what the model knows, labeled "Not checked against reports".
- `live/js/city.js`: city, numbers, scams. `live/js/places.js`: nearby places. `live/js/scan.js`: the scan. `live/js/app.js`: the screens.
- Location only works on https or localhost. The map tiles need a connection; everything else works offline once the page has been opened.
