# features/sync/
Mirrors an SOS to Firestore, so a trusted contact can follow it live in the web family view. SMS stays the path that works with no data.
- `FamilyLink.kt`: PURE LOGIC. The link for the SMS (`https://homeward-6999c.web.app/f/{shareId}`) and the random share id.
- `IncidentDocs.kt`: PURE LOGIC. The Firestore documents (trip, share, incident, update), in the shapes of `shared/schema/`.
- `IncidentSync.kt`: writes those documents for every message that goes to contacts, and hands the engine the family link.
- `IncidentCloud.kt`: the small interface it needs. `FirestoreCloud.kt`: the real one, and the only file that touches Firebase Auth and Firestore (anonymous sign-in, offline queue).
- `TripStore.kt`: remembers this phone's trip id and share id.

Nothing is written before she sends the alert. With no connection the writes wait on the phone and sync later; the SOS screen says so.
