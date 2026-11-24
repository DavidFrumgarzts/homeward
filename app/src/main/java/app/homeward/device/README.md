# device/
Phone hardware, no AI.
- `GeoPoint.kt`: lat/lng + distance. `LocationReader.kt`: last GPS fix. `LocationUpdates.kt`: live GPS while Home is open (works with no signal).
- `NetworkChecker.kt`: internet now? `ConnectivityWatcher.kt`: tells us when the connection comes back. `Haptics.kt`: the warning buzz.
