# app/
Starts the app and holds shared objects.
- `HomewardApplication.kt`: runs once at launch. Firebase, App Check, map setup.
- `MainActivity.kt`: asks permissions, downloads the on-device model, builds the safety pack, shows screens.
- `AppServices.kt`: creates every shared object (stores, senders, AI writers). Look here to see where anything comes from.
