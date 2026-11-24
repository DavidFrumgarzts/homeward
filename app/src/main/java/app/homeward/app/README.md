# app/
Starts the app and holds shared objects.
- `HomewardApplication.kt`: runs once at launch. Firebase, App Check, map setup, the SMS status receiver, and sending queued messages when signal returns.
- `MainActivity.kt`: downloads the on-device model, builds the safety pack, shows screens. (Permissions are asked in onboarding.)
- `AppServices.kt`: creates every shared object (stores, senders, AI writers, the incident engine). Look here to see where anything comes from.
