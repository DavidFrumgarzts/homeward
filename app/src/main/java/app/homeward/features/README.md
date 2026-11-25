# features/
One folder per feature. Each file says at the top what it does and whether it uses on-device AI, cloud AI, or no AI.
| Folder | Feature | Runs |
|---|---|---|
| `home/` | Map-first home: map, red-zone alert, SOS sheet | UI |
| `incident/` | The incident state machine and everything an SOS does (contracts, engine, messages, updates) | offline logic; AI only rewrites her sentence |
| `sos/` | The SOS screens, and sending by SMS with honest delivery status | UI + SMS |
| `session/` | Foreground service that keeps location going during an SOS | GPS, no AI |
| `sync/` | Mirrors an SOS to Firestore and makes the family link for the SMS | Firestore + anonymous sign-in, queues offline |
| `safetypack/` | Country safety pack (numbers, places, zones) | cloud AI once, then offline |
| `safetymap/` | Map drawing + red-zone logic (shown on Home) | offline logic + on-device AI |
| `safeplace/` | Pick the nearest open place to get help | offline logic |
| `osmplaces/` | Real safe places from OpenStreetMap | download on wifi, then offline |
| `offlinemap/` | Google Maps-like map, saved to the phone per city | download once on wifi |
| `safetyphoto/` | Read taxi plates etc., send when back online | on-device AI |
| `onboarding/` | First launch: welcome, contacts, permissions, get ready offline | UI + pack/AI setup |
| `contacts/` | Edit who gets the SOS (type or pick from phone contacts) | UI, saved on phone |
| `checkin/` | "I'm OK" text to family, location optional | SMS |
| `policecall/` | One-tap call to local police | phone dialer |
| `scancheck/` | Is this legit? Photo of a board, meter or price -> Looks fair / Be careful / Walk away; the recommended place | cloud research online, on-device reading, offline logic |
