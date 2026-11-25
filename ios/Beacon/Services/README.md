# Services/
The phone, the network and Firebase. Screens reach these through `App/AppServices.swift`, never directly.
- `Stores.swift`: her profile, contacts and setup choices, saved on the phone. `PackStore.swift`: the safety pack (the bundled Lapa pack until another is saved).
- `LocationService.swift`: GPS, read only while Home is open or an SOS is on. `NetworkMonitor.swift`: is there a connection? `Clock.swift`: now, and the "1:56 AM" format.
- `FirebaseSetup.swift`: App Check (debug provider in debug builds), anonymous sign-in, Firestore offline storage.
- `IncidentSync.swift`: writes trip, share, incident and updates to Firestore (shape: `shared/schema/README.md`) and says whether they have synced. `IncidentRecord.swift`: the incident document's fields. `SyncLog.swift`: logs what the server said to each write (accepted or refused).
- `IncidentEngine.swift`: owns the incident; feeds events to the reducer. `IncidentEngine+Effects.swift`: does what the reducer asks (location, AI rewrite, Messages, Firestore).
