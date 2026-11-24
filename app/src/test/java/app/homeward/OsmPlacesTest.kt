package app.homeward

import app.homeward.features.offlinemap.OfflineArea
import app.homeward.features.osmplaces.OpeningHours
import app.homeward.features.osmplaces.OverpassParser
import app.homeward.features.osmplaces.OverpassQuery
import app.homeward.features.osmplaces.PlacesEnricher
import app.homeward.features.safetypack.DemoRioPack
import app.homeward.features.safetypack.SafePlace
import org.junit.Assert.*
import org.junit.Test

// Checks OpenStreetMap safe places: query, parsing (real Lapa sample), opening hours, and the swap.
class OsmPlacesTest {
    // Trimmed real answer from overpass-api.de for Lapa, Rio (2026-11-24), plus one building with a center.
    private val sample = """
    {"elements":[
     {"type":"node","id":448811939,"lat":-22.9131614,"lon":-43.1913321,
      "tags":{"addr:street":"Rua Riachuelo","amenity":"police"}},
     {"type":"node","id":450707553,"lat":-22.9131075,"lon":-43.1826357,
      "tags":{"amenity":"pharmacy","name":"Drogarias Max","opening_hours":"24/7"}},
     {"type":"way","id":1,"center":{"lat":-22.9079,"lon":-43.1885},
      "tags":{"amenity":"hospital","name":"Hospital Souza Aguiar"}},
     {"type":"node","id":2,"lat":1.0,"lon":1.0,"tags":{"shop":"bakery"}}
    ]}""".trimIndent()

    @Test fun queryAsksForAllFourKindsInTheBox() {
        val q = OverpassQuery.safePlaces(OfflineArea.Box(north = -22.90, east = -43.17, south = -22.92, west = -43.19))
        assertTrue(q.contains("police|hospital|pharmacy|fuel"))
        assertTrue(q.contains("(-22.92,-43.19,-22.9,-43.17)"))
    }

    @Test fun parsesNodesAndBuildings() {
        val places = OverpassParser.parse(sample)
        assertEquals(3, places.size) // the bakery is ignored
        assertEquals("Police (Rua Riachuelo)", places[0].name)
        assertTrue(places[1].open24h)
        assertEquals(-22.9079, places[2].lat, 1e-6)
    }

    @Test fun hours() {
        assertTrue(OpeningHours.parse("24/7", "fuel").open24h)
        val day = OpeningHours.parse("Mo-Sa 08:00-22:00", "pharmacy")
        assertEquals(8, day.opensHour); assertEquals(22, day.closesHour)
        assertTrue(OpeningHours.parse(null, "hospital").open24h)      // ER assumed
        assertFalse(OpeningHours.parse(null, "police").open24h)       // unknown: daytime only
    }

    @Test fun swapsInOsmPlacesOnlyWhenSomeCameBack() {
        val real = listOf(SafePlace("Real pharmacy", "pharmacy", -22.913, -43.182, open24h = true))
        val swapped = PlacesEnricher.withOsmPlaces(DemoRioPack.pack, fetch = { real })
        assertEquals(real, swapped.safePlaces); assertTrue(swapped.placesFromOsm)
        val kept = PlacesEnricher.withOsmPlaces(DemoRioPack.pack, fetch = { emptyList() })
        assertEquals(DemoRioPack.pack.safePlaces, kept.safePlaces); assertFalse(kept.placesFromOsm)
    }
}
