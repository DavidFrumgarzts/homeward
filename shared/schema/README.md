# shared/schema

The data every Beacon app (Android, iOS, web) reads and writes. If a field changes here, change all three apps, the rules in `firebase/` and the fixtures in `shared/fixtures/` in the same commit.

- `safety-pack.schema.json`: the saved city pack (same shape as Android's `SafetyPack`).
- `trip.schema.json`, `incident.schema.json`, `location-update.schema.json`, `share.schema.json`: the Firestore documents below.

All times are numbers: milliseconds since 1970 (UTC). Apps must ignore fields they don't know and treat missing optional fields as their default, so an older app keeps working when a field is added.

## Firestore layout

Everyone signs in anonymously. "Owner" is the traveler's phone or browser.

| Path | Who writes | Who reads | Fields |
|---|---|---|---|
| `trips/{tripId}` | owner | owner | `ownerUid`, `travelerName`, `city`, `country`, `packId` (or null), `platform`, `createdAtMillis` |
| `trips/{tripId}/incidents/{incidentId}` | owner | owner, and a viewer holding a live share | see `incident.schema.json` |
| `trips/{tripId}/incidents/{incidentId}/updates/{updateId}` | owner | owner, and a viewer holding a live share | see `location-update.schema.json` |
| `trips/{tripId}/viewers/{viewerUid}` | the viewer, once, and only with a share id that points at this trip and is not revoked | that viewer; the owner | `shareId`, `createdAtMillis` |
| `shares/{shareId}` | owner (create, revoke, delete) | anyone signed in may `get` one by id; **nobody may list** | `tripId`, `ownerUid`, `contactLabel`, `createdAtMillis`, `revoked` |
| `packs/{packId}` | owner | owner | `ownerUid`, `city`, `country`, `pack` (a safety pack), `createdAtMillis` |

- `tripId` and `incidentId` are random UUIDs made on the device (`incidentId` is the incident's `sessionId`). `shareId` is 32 lowercase hex characters (128 random bits) made on the device, so the family link can go into an SMS before the phone has any connection.
- **How a family link works.** The link is `https://homeward-6999c.web.app/f/{shareId}` (locally `?f={shareId}`). The page signs in anonymously, `get`s `shares/{shareId}` to learn the `tripId`, creates `trips/{tripId}/viewers/{its own uid}` with that `shareId` (the rules check the share exists, points at this trip and is not revoked), and then listens to the trip's incidents and their updates. Knowing the link is the permission; revoking the share (`revoked: true`, or deleting it) cuts every viewer off. A viewer can read incidents and updates of that one trip and nothing else, and can write nothing except its own viewer document.
- The family view never reads the trip or the pack. Everything it shows (her name, the city, the emergency numbers) is copied into the incident document.
- `updates` are ordered by `createdAtMillis`. The first one has `kind: "alert"`, the last one of a finished incident has `kind: "ended"`.
- Writes made with no connection queue on the device (Firestore offline persistence) and sync later. The UI must say "Saved on your phone" until they have synced.
