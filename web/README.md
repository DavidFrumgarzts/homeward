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

## Phone demo in Chrome

With `serve.py` running, open http://localhost:4173/phone/ to use the apps inside an iPhone 18 Pro frame (402 x 874, Dynamic Island, home indicator), scaled down to fit shorter windows. The side panel switches between Beacon live (`/live/`), Rio Beacon (`/`) and the family view (`/demo`), starts over (`?reset`), and can pretend the phone is in Jaipur, Times Square or Lapa (`?at=lat,lng`); by default Chrome asks for this computer's real location.

The app gets `?frame=phone`, which loads `phone/frame.js` inside it: content starts below the Dynamic Island (62 px) and ends above the home indicator (34 px), and it is test mode. Nothing texts or calls anyone: `sms:` and `tel:` links and Beacon live's automatic texts (`live/js/texts.js`, which skips the `sendText` function) show up on the demo page instead. The camera step is skipped with an empty stream; Scan takes an uploaded photo. Without `?frame=phone` the apps are unchanged.

## Desktop layout

On a wide screen the same pages are laid out for a computer (Figma "Beacon live / Rio Beacon / Family view — desktop"), in CSS media queries at the end of `styles.css` and `live/live.css`. Under 900 px wide (phones, and the 402 px phone demo) nothing changes. From 900 px: Home is a side panel (the phone's bottom sheet) beside a full-height map, and Ask and Scan open in that panel while the map stays; the story, onboarding and setup put their picture beside the text; SOS is one centred card; the family view is details beside the map (and a third column for numbers and the timeline from 1280 px). The markup only gains a few class hooks (`.duo`, `.focus`, `.settings`, `.side-head`, `.desk-art`, `.fam-col`), all hidden or neutral on phones.

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
- `phone/`: the phone-frame demo page above (`links.js` is pure logic, tested in `tests/phone.test.js`). Development only.
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

### First launch: the onboarding (Figma "Onboarding v3")
Eight screens, each showing Beacon solve a problem and then asking for one thing (`live/js/onboard.js`, order in `js/onboarding.js`):
the night in Rajasthan → **booking** (Gmail, a sample, or paste) → **location** → no signal (the saved hospital drive) → **trusted people** (+ their check-in link) → late-night safe places → **camera** (scam check) → "Getting {city} ready" with real counts.

### What it does
- **The map** (`live/js/basemap.js`, `live/map-style.json`): David's map colors drawn by MapLibre GL from OpenFreeMap vector tiles (free, no key or sign-up; credit "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" always shown, tiles never saved), under Leaflet's layers via maplibre-gl-leaflet; CARTO Voyager pictures if WebGL or OpenFreeMap fails.
- **City, numbers, places, scams:** your city from GPS (Nominatim), emergency numbers by country (`js/emergency.js`; India 112 / ambulance 108), police, hospitals and 24-hour pharmacies from OpenStreetMap saved for offline, scams reported in your city (`js/cityscams.js`, Gemini with Google Search).
- **Booking check** (`live/js/bookingflow.js`, `js/booking.js`): the AI reads the booking, the hotel goes on the map, hospitals within 60 km, the drive to the nearest (FOSSGIS OSRM car router), and "No hospital within a 30-min drive" when that's true. Saved in the browser only.
- **Beacon's own walking router** (`js/walkroute.js`): street data from OpenStreetMap, main and lit streets cost less, alleys and unlit streets more, areas to avoid 25×; shortest path on the phone, so it works with no signal. Say "Tonight I'm going to Bar Palladio, then back to my hotel" in Ask Beacon: it saves the streets, the areas and both routes (`live/js/trips.js`). "Way back to my hotel" then works offline; off the saved streets it gives direction and distance.
- **Areas to avoid** (`js/areas.js`): Beacon's list for the demo cities (each with hours, why and a source; shown only once reviewed) plus areas you mark yourself on the map ("Avoid an area").
- **Red zones from police data** (`js/crimedata.js`, `js/unsafe.js`, `live/js/unsafezones.js`): where official street-crime reports cluster. New York: NYPD Complaint Data (NYC Open Data, SODA API, no key), robbery, felony assault and grand larceny from the person, outdoors, 18:00–06:00, last 12 months. England, Wales and Northern Ireland: data.police.uk (Open Government Licence v3.0, no key), robbery, violent crime and theft from the person within a mile, last 3 months (no time of day in that data). Sexual offences are left out. Other cities: no crime layer. Reports are binned into 150 m cells; a cell is red with at least 5 reports and in the top 5% of cells around her, and touching cells merge. Saved on the phone (zones only) and refreshed after 7 days. Drawn only within a 30-minute walk (or on her saved routes); tap one for why and the source. Routes go around them like areas to avoid. **They never send the automatic "danger" text**: only Beacon's reviewed list and her own marks do (`js/alerts.js` `textableAreas`, tested).
- **Quiet after dark** (OpenStreetMap tags): unlit footpaths, underpasses and paths through parks cost more in the router and show as an amber note on the route card. Not red zones, never texts.
- **At night** (9 p.m.–6 a.m.) nearby 24-hour places blink yellow on the map.
- **Hospital drive** (`live/js/drive.js`): saved when places load; "I feel very sick" answers with the ambulance number and the saved drive, with "Drive there in Google Maps" when online (a link, not Google's Routes API, whose terms forbid our map and offline storage).
- **Trusted people can ask how you are** (`live/js/answering.js`, `js/familyask.js`, `js/seal.js`): their link opens the family page; "Ask how Julia is" sends a question with their public key; her phone answers by itself (where she is, the last hour, her plans, whether she's in an area to avoid), locked with WebCrypto (ECDH P-256 + AES-GCM) so only the asker's browser can read it. She sees every answer and can pause. With no signal her phone keeps the question and answers when signal is back; the asker's page says "checking every minute". Firestore: `trips/{tripId}/checkins` (rules + tests in `firebase/`).
- **Scan** ("Is this legit?"): a photo matched to the scams saved for your city.

### Gmail (testing mode)
Copy `google-config.example.js` to `google-config.js` (git-ignored) with the OAuth Web client ID. Google keeps Gmail reading to the test users listed in the Cloud console until the app is verified, so the button only works for them. Everyone can use **Try a sample booking** and **Paste a booking**, which run the same AI step.

### Testing instructions (judges)
1. Open https://homeward-6999c.web.app/live/ on a phone or in Chrome's phone view. The onboarding starts.
2. Booking: tap **Try a sample booking** (a made-up desert camp near Jaisalmer): it shows the hotel, the hospitals and "No hospital within a 30-min drive". Gmail works with the judges' test account (address below; password in the Devpost form).
3. Allow location, add a trusted person (your own number is fine), finish.
4. In Ask Beacon: "Tonight I'm going to <a place near you>, then back to my hotel". Turn on airplane mode, then tap "Way back…".
5. Open the check-in link on another device and tap "Ask how … is" while the app is open.

Judges' Gmail test account: trialhackathon@gmail.com (password in the Devpost form). Sign in with it on **Let Beacon find my bookings**; Google shows "Google hasn't verified this app" while the app is in Testing: tap **Continue**.

### Run and test locally
- `?at=lat,lng` on localhost fakes a position (e.g. `?at=26.9157,75.8069` for Jaipur). `?reset` starts over.
- Location only works on https or localhost. Map tiles need a connection; everything else works offline once saved.
