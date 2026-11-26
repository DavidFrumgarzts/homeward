# Onboarding v3 for Beacon live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The live web app's first launch becomes the Figma "Onboarding v3" story (7 screens, real permission asks), with booking from email, Beacon's own offline walking router, trips planned in Ask Beacon, dangerous areas (team list + her marks) and night-time blinking safe places.

**Architecture:** Pure logic in `web/js/` (router, areas, booking parsing, onboarding steps), each with Vitest tests. Browser I/O in `web/live/js/` (Overpass, Nominatim, OSRM, Gmail, screens). The spike `web/spike/router.js` (uncommitted) is the starting point for the router.

**Tech Stack:** Plain ES modules, no build step; Leaflet; Firebase AI Logic (`web/js/ai.js`: `askAi`, `askAiWithSearch`); Google Identity Services (Gmail); OpenStreetMap Overpass, Nominatim, FOSSGIS OSRM (car); Vitest.

**Spec:** `docs/superpowers/specs/2026-11-25-onboarding-v3-design.md`. Figma file `jCWSWsN9Cf2zJBWWP4n5Pf`, page "Onboarding v3", section `46:240`.

## Global Constraints

- Every screen promises only what the app does on day one.
- No email text, tokens or bookings on Beacon's servers; trips, streets and her areas live in the browser only.
- Never name a real business as a scam; the team area list is reviewed by David before it ships.
- Every AI call has a non-AI fallback (existing rule).
- "© OpenStreetMap contributors" wherever a route or OSM data is shown.
- Copy rules: plain words, no all-caps tags (small map stamps excepted), red only for SOS, police calls and dangerous areas. Onboarding screens use Figtree.
- India: police 112, ambulance 108.
- Every file in `web/js/` must be listed in `web/sw.js` (`web/tests/files.test.js`); new live files go in `web/live/sw.js`, cache bumped.
- Nominatim at most 1 request/second with an app-named User-Agent where the browser allows; Overpass one query per trip.

## Review Focus

1. No hotel saved (skipped booking) → "Way back" uses the trip's start point; never a crash or an empty route.
2. She's outside the saved streets with no signal → direction and distance plus "not a full route", never a wrong route.
3. Overpass / Nominatim / OSRM busy or offline → the step says so and onboarding continues.
4. AI unavailable → booking parsing, place extraction fall back (regex / "type the hotel's address"), never a blank screen.
5. Gmail popup blocked or consent denied → back on screen 2 with the other two options, a one-line reason.

---

### Task 1: Router (pure)

**Files:**
- Create: `web/js/router.js` (from `web/spike/router.js`, keep its API)
- Test: `web/tests/router.test.js`

**Interfaces:**
- Produces: `meters([lat,lng],[lat,lng]) -> number`, `walkable(tags) -> bool`, `safetyFactor(tags) -> number`, `inside([lat,lng], ring) -> bool`, `buildGraph(ways, avoidRings) -> Graph`, `markDanger(g, avoidRings)`, `route(g, from, to, "safe"|"fastest") -> {path, metres, minutes, dangerMetres, steps:[{name,m}]} | null`, `pack(g) -> string`, `unpack(string) -> Graph`, `directionTo(from, to) -> {metres, compass}` (compass one of N NE E SE S SW W NW).

- [ ] **Step 1: Tests** on a hand-made grid of ways (Overpass `out geom` shape: `{tags, geometry:[{lat,lon}]}`): a square where the short side is `highway=service` and the long side `highway=primary, lit=yes`:
  - `route(g,A,B,"fastest").metres` < `route(g,A,B,"safe").metres` and the safe path's steps name the primary road.
  - With an avoid ring over the primary road, `safe` takes the other side and `dangerMetres === 0`; `fastest` reports `dangerMetres > 0` when it crosses it.
  - `walkable({highway:"motorway"}) === false`, `walkable({highway:"footway", foot:"no"}) === false`.
  - `unpack(pack(g))` gives the same `route(...).metres`.
  - Disconnected start/end → `null`.
  - `directionTo([26.9,75.8],[26.91,75.8])` → `{compass:"N"}` and metres ≈ 1112 (±5).
- [ ] **Step 2:** `cd web && npx vitest run tests/router.test.js` → FAIL (module missing).
- [ ] **Step 3:** Copy the spike, add `directionTo`, keep factors: primary .8, secondary .85, tertiary .9, pedestrian .85, residential 1.15, service 1.6, footway 1.4, path 2.2, alley 2.5, lit ×0.8, unlit ×1.5, danger ×25. Add `/js/router.js` to `web/sw.js`.
- [ ] **Step 4:** Tests PASS; full `npx vitest run` PASS.
- [ ] **Step 5:** Commit "Beacon's own walking router (offline, prefers busy lit streets, avoids marked areas)".

### Task 2: Dangerous areas: team list + her marks

**Files:**
- Create: `web/js/areas.js` · Test: `web/tests/areas.test.js`

**Interfaces:**
- Produces: `TEAM_AREAS` (array of `{id, city, name, ring:[[lat,lng]...], fromHour, toHour, why, source, reviewed}`), `areasFor(cityName, hour, mine=[]) -> [{name, ring, origin:"Beacon's list"|"Marked by you", why, source}]`, `activeAt(area, hour) -> bool` (handles 22→5 wrapping midnight).
- Her marks are stored by the live app (Task 5) as `[{name:"Marked by you", ring}]` in localStorage `beacon.myAreas`; `areasFor` only merges them.

- [ ] **Step 1: Tests:** `activeAt({fromHour:22,toHour:5},23)` true, `(…,12)` false, `(…,4)` true; `areasFor("Jaipur",23)` returns only Jaipur entries with `reviewed: true`; entries with `reviewed:false` are never returned; her marks always returned whatever the hour.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Draft entries for Jaipur and Lapa (Rio) from published sources (one source URL each), all `reviewed: false`. Lapa's Rua dos Inválidos ring comes from `web/js/pack.js`'s zone. Add to `web/sw.js`.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit. **Stop point:** list the drafted areas with sources for David; flip `reviewed` only on his yes.

### Task 3: India's ambulance number

**Files:** Modify `web/js/emergency.js` (remove `in` from the 112 list, add `in: { police: "112", ambulance: "108" }`); Test `web/tests/emergency.test.js`.
- [ ] Test `numbersFor("in")` → `{police:"112", ambulance:"108", known:true}`; FAIL; implement; PASS; commit.

### Task 4: Trips: save streets and routes for no signal

**Files:**
- Create: `web/live/js/trips.js` · Create (pure): `web/js/trip.js` · Test: `web/tests/trip.test.js`

**Interfaces:**
- Consumes: Task 1 router, Task 2 `areasFor`.
- Produces (pure, `web/js/trip.js`): `boxFor(a, b, marginM=700) -> [s,w,n,e]`, `placeFromPlan(text) -> string|null` (regex fallback: "going to X", "go to X", "visit X", stops at ", then", " then", ".", ","), `placePrompt(text) -> string`, `readPlace(aiText) -> string|null` (JSON `{"place": "..."}`, tolerates code fences).
- Produces (I/O, `web/live/js/trips.js`): `planTrip({from:[lat,lng], hotel:[lat,lng]|null, placeName, city}, onStep) -> Promise<Trip|{error}>`, `savedTrip() -> Trip|null`, `wayBack(at:[lat,lng]) -> {route, fastest} | {direction:{metres,compass}, partial:true}`, where `Trip = {place:{name,at}, home:[lat,lng], there, back, savedAt}` and the packed graph is stored under localStorage `beacon.trip.graph`.

- [ ] **Step 1: Tests (pure):** `boxFor` contains both points with ≥700 m margin; `placeFromPlan("Tonight I'm going to Bar Palladio, then back to my hotel.") === "Bar Palladio"`; `placeFromPlan("hi") === null`; `readPlace('```json\n{"place": "Bar Palladio"}\n```') === "Bar Palladio"`.
- [ ] **Step 2:** FAIL. **Step 3:** implement pure functions; then `trips.js`: Nominatim (`place, city`), Overpass `way["highway"](box);out geom tags;` over the three servers in `places.js`, `buildGraph(ways, areasFor(...).map(a=>a.ring))`, both routes there and back, save. `wayBack` uses only saved data (no fetch). `home` = hotel if known else `from`. Add both files to their service workers.
- [ ] **Step 4:** PASS. **Step 5:** Commit.

### Task 5: Live app: routes, areas, planning in Ask Beacon, night rings

**Files:** Modify `web/live/js/app.js`; Create `web/live/js/routemap.js` (Leaflet drawing); Modify `web/live/live.css`; pure `nightRings(hour) -> bool` (21:00–05:59) in `web/js/trip.js` with a test.

- [ ] **Step 1: Test** `nightRings(21)`, `(2)` true; `(6)`, `(20)` false. FAIL → implement → PASS.
- [ ] **Step 2:** Ask Beacon: when `placeFromPlan(text)` or the AI (`placePrompt`/`readPlace`) finds a place, call `planTrip`, show progress in the chat, end with "Saved for no signal: the way to {place} and back." Chips: "Way back to my hotel" (opens Home with the route) and "I'm going out tonight" (fills the box).
- [ ] **Step 3:** Home map (`routemap.js`): saved route (blue, 6 px) and fastest (grey dashed); areas from `areasFor` (red 15% fill, tooltip name + origin + source); the hotel badge; after `nightRings(new Date().getHours())`, `go-here` blinking rings on nearby 24-hour places; "Avoid an area" button → tap 4 corners → saved to `beacon.myAreas`, routes re-marked with `markDanger`. OSM credit stays.
- [ ] **Step 4:** Manual check on localhost (Jaipur sample position via `?at=26.9157,75.8069` dev param): plan → route drawn; mark area → route changes; reload offline (DevTools offline) → "Way back" still draws. Commit.

### Task 6: Booking from email (sample, paste, Gmail)

**Files:**
- Create (pure): `web/js/booking.js` · Test: `web/tests/booking.test.js`
- Create: `web/live/js/bookingflow.js`, `web/live/js/gmail.js`; config `web/google-config.example.js` → git-ignored `web/google-config.js` exporting `gmailClientId`.

**Interfaces:**
- Produces (pure): `SAMPLE_BOOKING` (made-up desert camp at Sam, near Jaisalmer, Rajasthan; dates next month), `bookingPrompt(text) -> string`, `readBooking(aiText) -> {hotel, address, city, country, checkIn, checkOut} | null` (null when hotel or city missing), `hospitalWarning(nearest:{name, minutes}|null) -> {warn:boolean, text}` (warn when null or minutes > 30; text "No hospital within a 30-min drive. Nearest: {name}, {h} h {m}." / "Nearest hospital: {name}, {m} min by car.").
- Produces (I/O): `checkBooking(text) -> Promise<{booking, at:[lat,lng], hospitals, nearest, warning} | {error}>` (AI → `readBooking`; no AI → `{error:"no-ai"}` and the screen asks for the address; Nominatim; Overpass hospitals `around:60000`; OSRM `routing.openstreetmap.de/routed-car` durations to the 3 closest by air, 1 request/s); `saveTrip`/`savedBooking()` in localStorage `beacon.booking`. `readGmailBookings() -> Promise<string[]|{error}>`: GIS token client, scope `https://www.googleapis.com/auth/gmail.readonly`, query `newer_than:6m (hotel OR booking OR reservation) (confirmation OR confirmed OR check-in)`, max 5, plain text body (decode base64url, strip HTML), token kept in memory only and revoked after.

- [ ] **Step 1: Tests:** `readBooking` on a fenced JSON reply → object; missing city → null; `hospitalWarning(null).warn === true`; `hospitalWarning({name:"X", minutes:45}).text` contains "No hospital within a 30-min drive"; `({minutes:12})` → warn false, "12 min by car". FAIL → implement → PASS. Add to `web/sw.js`.
- [ ] **Step 2:** I/O modules; Gmail button only shown when `gmailClientId` exists.
- [ ] **Step 3: Stop point (David):** create OAuth consent screen (External, Testing), Web client ID with origins `https://homeward-6999c.web.app`, `http://localhost:4173`; add test users. Ask before each console step.
- [ ] **Step 4:** Commit.

### Task 7: Onboarding screens

**Files:**
- Create (pure): `web/js/onboarding.js` · Test: `web/tests/onboarding.test.js`
- Create: `web/live/js/onboard.js` (screens), `web/live/img/onb-night.png`, `onb-way.png`, `onb-late.png`, `onb-atm.png`, `onb-sos.png` (exported from Figma frames' picture areas at 2×), Modify `web/live/index.html` (Figtree), `web/live/live.css`, `web/live/js/app.js` (start: onboarding when `!store.setupDone`).

**Interfaces:**
- Produces (pure): `STEPS = ["night","booking","location","nosignal","people","late","scan","ready"]`, `nextStep(step, {contacts}) -> step|null` (from "people" only with ≥1 contact), `skipTo(step) -> step` (Skip from any screen before "people" goes to "people"; after it, to the next step).
- Screens copy and layout: Figma frames 01, 02, 03, 04, 07 (+05's look for the people form), 08, 09, 10. Screen 7's trusted-people form: name, contacts (Contact Picker API where available, else name + phone fields), cards per person with initial and `shortPhone`. Location: `navigator.geolocation.getCurrentPosition`. Camera: `navigator.mediaDevices.getUserMedia({video:true})` then stop tracks; denied → one line, continue. Ready: real counts as they load (places by kind, scams via `research`), button "Start exploring {city}".

- [ ] **Step 1: Tests** for `nextStep`/`skipTo` incl. "people" with 0 contacts → stays. FAIL → PASS.
- [ ] **Step 2:** Export pictures from Figma (`get_screenshot` of each map/photo node, 2×). Build screens. Add files to `web/live/sw.js`, bump cache to `beacon-live-v2`.
- [ ] **Step 3:** Manual run through all 7 at 393×852 in the browser pane, compare with Figma, fix. Commit.

### Task 6b: Trusted people can ask how she is

**Files:** pure `web/js/checkin.js` (+ `web/tests/checkin.test.js`): `answerText({name, place, minutesAgo, plan, inDanger, steps}) -> string` (template), `answerPrompt(facts) -> string`, `waitingText(lastAnswerAt, now) -> string` ("Waiting for Julia's phone · checking every minute · last answer at 21:10"); `web/js/seal.js` (+ test): `makeKeys() -> {publicJwk, privateKey}`, `seal(publicJwk, text) -> {epk, iv, data}`, `open(privateKey, sealed) -> text` (ECDH P-256 + AES-GCM, round-trip test in Node's WebCrypto). I/O: `web/live/js/answering.js` (listens for requests while open, retries every 60 s and on `online`, writes sealed answers, keeps the "answers sent" log in localStorage, pause switch), `web/js/family.js` + `web/js/familydata.js` ("Ask how {name} is" button, key pair in IndexedDB, request doc, decrypted answer, waiting line refreshed every minute). Firestore: `requests` and `answers` under the share, rules + tests in `firebase/`, TTL 24 h.

- [ ] Tests: `seal`/`open` round trip; `open` with another key throws; `answerText` includes place and "6 min from her hotel"-style plan text and "Not in a dangerous area"/"In a dangerous area"; `waitingText` formats the time. Rules tests: only the share's viewer can create a request; only the trip owner can write an answer; nobody else reads either.
- [ ] Implement, deploy rules (ask first), commit.
- [ ] Stretch (after Task 8 if time): FCM web push wakes the service worker to answer from the last saved location.

### Task 7b: Car route to the nearest hospital, saved for no signal

**Files:** Create `web/live/js/drive.js`; pure `googleMapsLink(from, to) -> string` (`https://www.google.com/maps/dir/?api=1&origin=lat,lng&destination=lat,lng&travelmode=driving`) and `driveText({name, minutes}) -> string` ("{name}, 3 h 40 by car" / "12 min by car") in `web/js/trip.js`, tests in `web/tests/trip.test.js`; Modify `web/live/js/app.js` (Ask Beacon sick answer, Home "Hospital route" card), `web/live/js/bookingflow.js` (reuse).

**Interfaces:** `saveHospitalDrive(from:[lat,lng], hospitals) -> Promise<{name, at, minutes, line:[[lat,lng]]}|null>` (OSRM `routed-car` with `overview=full&geometries=geojson`, the 3 nearest by air, 1 request/s, keeps the quickest), `savedHospitalDrive() -> same|null` (localStorage `beacon.hospitalDrive`).

- [ ] Tests: `driveText({name:"AIIMS Jodhpur", minutes:220}) === "AIIMS Jodhpur, 3 h 40 by car"`; `({minutes:12})` → "… 12 min by car"; `googleMapsLink` contains `travelmode=driving` and both coordinates. FAIL → implement → PASS.
- [ ] Save the drive when a booking is checked and when Home's places load (once per 1.5 km move). Offline sick answer and Home card use only saved data; "Open in Google Maps" shows only when online. Commit.

### Task 8: Docs, tests, deploy

- [ ] README `web/README.md` live section: onboarding, routes, areas, booking; **Testing instructions for judges** (sample booking always works; Gmail for listed testers; judges' account address, password only in Devpost).
- [ ] `cd web && npx vitest run` all PASS; e2e (`JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home npm run test:e2e`) PASS.
- [ ] Ask David, then deploy hosting; check on homeward-6999c.web.app/live in a fresh profile: full onboarding, sample booking warning, plan trip, offline way back.
- [ ] Open PR.
