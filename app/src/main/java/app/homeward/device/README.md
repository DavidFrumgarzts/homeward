# device/
Phone hardware, no AI.
- `GeoPoint.kt`: lat/lng + distance. `LocationReader.kt`: last GPS fix, with its time and accuracy. `LocationUpdates.kt`: live GPS while Home is open or a safety session runs (works with no signal).
- `MapsLink.kt`: a map link for messages. `Speaker.kt`: reads text aloud with the phone's own voice.
- `SignalChecker.kt`: could a text leave the phone now (cell signal, not data)? `BatteryReader.kt`: battery percent.
- `NetworkChecker.kt`: internet now? `ConnectivityWatcher.kt`: tells us when the connection comes back. `Haptics.kt`: the warning buzz.
