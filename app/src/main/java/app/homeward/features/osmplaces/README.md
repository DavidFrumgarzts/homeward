# features/osmplaces/
REAL safe places from OpenStreetMap (police, hospitals, pharmacies, gas stations), fetched while online and saved in the pack.
- `OverpassQuery.kt`: the question we ask OpenStreetMap for a box of the city.
- `OsmPlacesFetcher.kt`: downloads the answer (slow public servers: long timeout + backup server).
- `OverpassParser.kt`: JSON -> SafePlace. Unnamed places get a name like "Police (Rua Riachuelo)".
- `OpeningHours.kt`: "24/7" and "08:00-22:00" -> open hours. Unknown hours: hospitals 24h, others daytime only.
- `PlacesEnricher.kt`: swaps the AI-researched places for these real ones (keeps the 80 closest).
