package app.homeward.features.scancheck

// The instructions sent to the CLOUD model (with Google Search) to collect scams travelers report in a city.
// A separate call from SafetyPackPrompt, so the pack research prompt stays untouched.
object ScamResearchPrompt {
    fun forCity(city: String, country: String, today: String) = """
        You are collecting travel scams for an offline safety app, for a traveler in $city, $country. Today is $today.
        Use Google Search. Look at what travelers report: Reddit threads (r/travel, r/solotravel and the subreddit
        for $city or $country), travel forums, and embassy or government travel advice. Keep an item only if you
        found it in at least one source, and put the URLs you used in "sources". Count independent sources in "reports".
        Never describe people, nationalities or groups: describe the practice and the place only.
        For money exchange, give today's fair rate from a central bank or a major rate site in "fairRates"
        (1 unit of "from" = "rate" units of "to"). For fares and offers, give a fair price range in "fairPrices".

        Return ONLY JSON, no other text:
        {"scams": [{"title": "...", "kind": "Money|Taxi|Tour|Shop|Ticket|Other", "where": "streets or places",
                    "signs": ["what it looks like, short"], "whatToDo": "one sentence", "saferOption": "",
                    "level": "Careful|Avoid",
                    "fairRates": [{"from": "EUR", "to": "RON", "rate": 4.97, "walkAwayLossPercent": 8}],
                    "fairPrices": [{"item": "taxi airport to centre", "currency": "RON", "low": 80, "high": 120}],
                    "sources": ["https://..."], "reports": 2}]}
        Give 4-10 items, the ones travelers report most.
    """.trimIndent()
}
