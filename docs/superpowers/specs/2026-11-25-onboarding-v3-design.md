# Onboarding v3 for Beacon live (design)

Figma: file `jCWSWsN9Cf2zJBWWP4n5Pf`, page "Onboarding v3" (10 screens, Figtree). Approved in conversation with David on 2026-11-25.

## Why

A new traveler thinks "what's in it for me?" on every screen. Each screen shows Beacon solving a real problem (David's sister was sick in India, 8 hours from a hospital), then asks for the one permission that makes it work. Show, don't tell.

## Goals

- The first-launch flow of the live web app (`web/live/`, https://homeward-6999c.web.app/live/), replacing today's one-screen setup.
- Every screen promises only what the app really does on day one.
- Real permission asks: email (booking), location, trusted people, camera.
- Judges of #BuildHybridAI can use every part without restriction (rules, section 6).

- Safe walking routes that work with no signal: Beacon's own router (below).

## Non-goals (later, not in this build)

- Figma screens 5's "they can ask how you are any time" and 6 (dangerous area, family told automatically). They need background location, a relay and the Android app.
- Dangerous areas found by AI. Tested 2026-11-25: asked for areas official sources name, Gemini with Google Search returned none for Jaipur or Rio.
- Google's Gmail verification. The Gmail part stays in testing mode.

## Anti-goals

- Promising a feature the app doesn't have.
- Keeping email text, tokens or bookings on Beacon's servers.
- Calling a real business a scam.

## Approaches considered

1. All 10 Figma screens as a clickable demo. Rejected: a demo, not a product, and it promises missing features.
2. All 10 screens plus every missing feature. Rejected for now: weeks of work, mostly Android.
3. **Chosen:** the real onboarding with the screens that are true today, plus booking from email in three ways (Gmail sign-in for named testers, a sample booking, pasting a booking).

## The flow

| # | Figma screen | Shows | Asks / does |
|---|---|---|---|
| 1 | The real night | Map picture: her hotel, "Nearest hospital · 8 hours by road", the story sentence | "See it with Beacon" |
| 2 | Booking found | Three buttons, then the real result: hotel, dates, a map with the hotel and hospitals around it, and the 30-minute warning when it applies | Gmail sign-in, "Try a sample booking", "Paste a booking", Skip |
| 3 | Safe way back | Map picture: Beacon's route on main, lit streets around a dangerous area, next to the fastest one, saved for no signal | Location (real browser prompt) |
| 4 | No signal, sick | Airplane mode: "I feel very sick. Where do I go?" answered from what's saved (AI on the computer in Chrome; saved-facts answer elsewhere, labeled honestly), call 108, and the saved car route to the nearest hospital | Nothing new |
| 7 | SOS, one-tap calls | What her people get in an SOS, and one-tap police and ambulance | Name and trusted people (contact picker where the browser has one, fields otherwise) |
| 8 | Late at night | Map picture with yellow rings on safe places | Nothing (it's a feature: after 9 p.m. Home's map rings nearby 24-hour places in blinking yellow) |
| 9 | Scam check | The ATM photo and Beacon's verdict | Camera (real browser prompt) |
| 10 | Getting your city ready | Real counts as they load: hospitals, police, pharmacies, scams | "Start exploring {city}" |

Skip is on every screen and goes to the next ask, never past the trusted-people step (SOS needs at least one person).

### Booking from email (screen 2)

- **Gmail:** Google Identity Services token client in the browser, scope `gmail.readonly`. Search the last 6 months for hotel booking emails, read at most 5, send only their text to Gemini (Firebase AI Logic, cloud) to pull out hotel, address, city, country and dates as JSON. The token stays in memory and is dropped after.
- **Sample booking:** a made-up confirmation for a desert camp at Sam, near Jaisalmer, Rajasthan (a real place far from a hospital, no real business). Same AI step.
- **Paste:** any booking text, same AI step.
- **After the AI step:** geocode the address (Nominatim), find hospitals within 60 km (Overpass), and drive time to the nearest few (FOSSGIS OSRM car). No hospital within a 30-minute drive gives the warning, with the nearest one and its time. The trip is saved in the browser only.
- **Screen copy:** "Beacon reads only booking emails. The AI reads them to find your hotel. Nothing is kept on our servers."
- **Testing mode:** OAuth consent screen "External, Testing", test users added by hand (David, the team, a judges' account David creates). The judges' account address goes in the README testing instructions; its password only in the Devpost form.

### Routes (Beacon's own router)

Proven in a throwaway test on 2026-11-25 (Jaipur, hotel on MI Road to Bar Palladio, 2.1 km): 1,060 streets, 0.6 MB downloaded, 0.2 MB saved, routes in under 10 ms with no network, and the route went around a marked area.

- **Streets:** OpenStreetMap ways from Overpass, for a box around the trip with a 700 m margin, saved on the phone. One download per trip, in the background, with a progress line.
- **Cost per street:** its length times a factor: main roads and lit streets lower, alleys, paths and unlit streets higher, and 25 times inside an area to avoid. "Fastest" is plain length.
- **Search:** Dijkstra on the phone. Steps by street name ("Ashok Marg 860 m → Sawai Mansingh Road 912 m").
- **Planning a trip:** in Ask Beacon she says where she's going ("Tonight I'm going to Bar Palladio, then back to my hotel"). The AI picks out the place, Nominatim finds it, Beacon saves the streets, the areas and both routes, then says "Saved for no signal: the way there and back".
- **With no signal:** "Way back to my hotel" opens the saved route, or works out a new one from where she is if she's inside the saved streets. Outside them: direction and distance, and "not a full route".
- **Map credit:** "© OpenStreetMap contributors" wherever a route is shown.

### Car route to the nearest hospital (screen 4 and the booking check)

- When a booking or a city pack is saved, Beacon asks the free OpenStreetMap car router (FOSSGIS OSRM, `routing.openstreetmap.de/routed-car`) for the drive to the nearest hospitals, and saves the time and the road line on the phone.
- With no signal, "I feel very sick" answers with the ambulance number and the saved drive ("AIIMS Jodhpur, 3 h 40 by car, route saved") and shows the line on Beacon's map.
- While online, "Open in Google Maps" hands the drive to Google Maps for live turn-by-turn directions with traffic. Not Google's Routes API: its terms forbid drawing its routes on a non-Google map and keeping them for offline use.

### Dangerous areas: a team list plus her own marks

- **Team list** (`web/js/areas.js`, pure data): areas for the demo cities (Jaipur; Lapa in Rio), each with a name, an outline, when it applies ("after 10 p.m."), why, and a source link. Shown as "From Beacon's list". Drafted from published sources and reviewed by David before it ships, because it names real places.
- **Her own marks:** "Avoid an area" on the map, tap the corners. Saved on her phone only, shown as "Marked by you".
- A city with neither gets ordinary routes on busy, lit streets, and Beacon says no areas are marked there.

### Real behaviour added outside the onboarding

- Home map: the saved hotel as a badge, and after 9 p.m. a blinking yellow ring on nearby 24-hour police, hospitals and pharmacies.
- India's ambulance number is 108 (police 112).

## Look

Figma "Onboarding v3": Figtree for the onboarding screens, Beacon colors, no all-caps tags except the existing small map stamps. The map pictures on screens 1, 3 and 8 are exported from Figma as images; text and buttons are HTML.

## Left to the builder

File split, the Gmail search query, prompt wording, and test cases, following the codebase rules (one job per file, pure logic with unit tests, AI calls with a non-AI fallback).
