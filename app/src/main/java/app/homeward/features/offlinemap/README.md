# features/offlinemap/
The map look and saving it for offline use.
- `MapStyle.kt`: which map tiles to use + credit line. Now standard OpenStreetMap (no key; no bulk download allowed).
- `OfflineArea.kt`: pure logic. Which box of the city to save (capped, never a whole country).
- `OfflineMapSaver.kt`: downloads that box once per city, on wifi, right after the safety pack.
