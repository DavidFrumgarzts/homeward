# features/offlinemap/
The map look and saving it for offline use.
- `MapStyle.kt`: Google Maps-like tiles (CARTO Voyager, OpenStreetMap data) + the required credit line.
- `OfflineArea.kt`: pure logic. Which box of the city to save (capped, never a whole country).
- `OfflineMapSaver.kt`: downloads that box once per city, on wifi, right after the safety pack.
