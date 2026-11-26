# App/
Starts the app and holds shared objects.
- `BeaconApp.swift`: the entry point. Starts the services once and hands them to the screens.
- `AppServices.swift`: creates every shared object (stores, GPS, Firestore sync, the incident engine). Look here to see where anything comes from. Also the debug launch options (`-resetBeacon YES`, `-demoSetup YES`).
- `TestMode.swift`: test mode (debug builds): no real texts or calls. On by default on the simulator and on a real iPhone; `-realTexts YES` turns it off on a phone.
- `RootView.swift`: setup on first launch, then Home; the SOS screens cover everything while an SOS is on.
