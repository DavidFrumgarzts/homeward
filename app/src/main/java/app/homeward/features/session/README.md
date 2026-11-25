# features/session/
Keeps a safety session running when the screen is off.
- `SafetySessionService.kt`: foreground service (type `location`). Reads GPS every 5 s during an SOS and passes each fix to the `IncidentEngine`. Started by the engine when an SOS starts, stopped when it ends. No session, no GPS.
- `SessionNotification.kt`: the neutral "Beacon is on" notification (also the lock-screen surface).

Not built yet (arrives with Safe Walk): the `microphone` service type, "I'm OK" and "SOS" buttons on the notification, slower GPS inside trusted areas, the 8-hour cap.
