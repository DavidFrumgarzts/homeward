# features/offlinemap/
The map look and saving it for offline use.
- `MapStyle.kt`: which map tiles to use + credit. CARTO Voyager (Google-like) when `CARTO_KEY` is in local.properties, else plain OpenStreetMap.
- `CartoTiles.kt`: CARTO tile URLs with the key added.
- `OfflineArea.kt`: pure logic. Which box of the city to save (capped, never a whole country).
- `OfflineMapSaver.kt`: pre-saves that ~2 km neighborhood once (CARTO only), and deletes saved tiles after 30 days (CARTO rule).
