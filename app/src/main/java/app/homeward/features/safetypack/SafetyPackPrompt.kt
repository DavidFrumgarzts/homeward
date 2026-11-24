package app.homeward.features.safetypack

// The instructions sent to the CLOUD model (with Google Search) to research a city.
// Kept in its own file so we can tune the wording without touching any logic.
object SafetyPackPrompt {
    // `nationality` may be empty: then no embassy is looked up, instead of guessing one.
    fun forCity(city: String, country: String, nationality: String): String {
        val who = if (nationality.isBlank()) "a traveler (nationality not given: leave embassyName and embassyPhone empty)" else "a $nationality traveler"
        return forTraveler(who, city, country)
    }

    private fun forTraveler(who: String, city: String, country: String) = """
        You are building an offline safety pack for $who who just arrived in $city, $country.
        Use Google Search. Only include facts you found in official or reputable sources (government sites,
        embassy pages, major news, travel advisories). If you are not sure about a fact, leave it out.

        Return ONLY JSON, no other text, in exactly this shape:
        {
          "city": "...", "country": "...",
          "police": "...", "ambulance": "...",
          "embassyName": "...", "embassyPhone": "...",
          "localPhrases": [{"english": "Help!", "local": "..."}],
          "safePlaces": [{"name": "...", "kind": "gas station|police|hospital|hotel",
                          "lat": 0.0, "lng": 0.0, "open24h": true, "opensHour": 0, "closesHour": 24, "note": "..."}],
          "zones": [{"name": "...", "level": "Safer|Careful|Avoid",
                     "polygon": [[lat, lng], [lat, lng], [lat, lng]],
                     "riskyFromHour": 23, "riskyToHour": 5,
                     "reasons": ["short reason based on a source"]}],
          "builtAtMillis": 0
        }

        Rules for zones: describe places and times of day only. Never describe people or groups.
        Give 8-15 local phrases for emergencies, 10-20 safe places, and 5-15 zones around tourist areas.
    """.trimIndent()
}
