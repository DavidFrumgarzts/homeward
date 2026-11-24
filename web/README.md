# web

Beacon as a web page: the same look and features as the Android app, in plain HTML, CSS and JavaScript (no build step).

Run it: `python3 -m http.server 4173 --directory web`, then open http://localhost:4173. Add `?reset` to the address to start over.

- `index.html`: the empty page; `js/app.js` draws every screen into it.
- `styles.css`: colors, type and layout (same values as the Android app and Figma "Beacon v2").
- `js/app.js`: the screens, one function each: story, welcome, contacts, ready, home, ask, sos, sent.
- `js/map.js`: draws the Lapa map, the place badges and your green dot; turns taps and GPS into map spots.
- `js/pack.js`: the saved Rio pack (numbers, phrases, red zone, safe places) and the red-zone checks.
- `js/ask.js`: Ask Beacon. Builds the prompt for the AI; without AI, plain rules answer from the pack.
- `js/sos.js`: writes the SOS and check-in messages and makes the link that opens the messages app.
- `js/ai.js`: the only file that talks to AI (Firebase AI Logic, hybrid: on-device in Chrome when it can, cloud otherwise).
- `js/cop.js`: the cartoon cop in the chat.
- `js/store.js`: remembers your name and contacts in the browser.
- `sw.js`: keeps a copy of the files so the page opens with no signal.

Differences from the Android app:
- A web page can't send a text by itself. SOS and "I'm OK" open your messages app with everything filled in; you press send.
- AI is off until `firebase-config.js` exists (copy `firebase-config.example.js`). Until then answers come from plain rules over the saved pack, and the SOS uses a fixed sentence.
- Outside Lapa the map is a demo: tap it to walk. Your real position is only used inside Lapa, and in the SOS message.
