package app.homeward.features.safetypack

import app.homeward.features.scancheck.FairPrice
import app.homeward.features.scancheck.FairRate
import app.homeward.features.scancheck.ScamKind
import app.homeward.features.scancheck.ScamLevel
import app.homeward.features.scancheck.ScamWarning

// Hand-made pack for the demo (Lapa, Rio de Janeiro). Real users get a pack built by SafetyPackBuilder.
// Check numbers before relying on them.
//
// Places and zones sit where the illustrated Lapa map draws them (features/lapamap), so the green dot,
// the red patch and the warnings agree. The drawing is stylized, so these coordinates are approximate.
//
// This is the source of shared/fixtures/rio-lapa-pack.json, which iOS and web load. DemoPackFixtureTest
// fails if the two differ; run it with BEACON_WRITE_FIXTURES=1 to write the file again after a change here.
object DemoRioPack {
    val pack = SafetyPack(
        city = "Rio de Janeiro",
        country = "Brazil",
        police = "190",
        ambulance = "192",
        embassyName = "U.S. Consulate General Rio de Janeiro",
        embassyPhone = "+55 21 3823-2000",
        localPhrases = listOf(
            Phrase("Help!", "Socorro!"),
            Phrase("Call the police", "Chame a polícia"),
            Phrase("I am being followed", "Estou sendo seguida"),
            Phrase("I need a hospital", "Preciso de um hospital"),
        ),
        safePlaces = listOf(
            SafePlace("5º DP police station", "police", -22.91255, -43.1803, open24h = true),
            SafePlace("Hospital Cruz Vermelha", "hospital", -22.91297, -43.18456, open24h = true),
        ),
        zones = listOf(
            SafetyZone(
                name = "Rua dos Inválidos",
                level = ZoneLevel.Avoid,
                polygon = listOf(listOf(-22.90838, -43.18348), listOf(-22.90838, -43.18149), listOf(-22.91125, -43.18149), listOf(-22.91125, -43.18348)),
                riskyFromHour = 23, riskyToHour = 5,
                reasons = listOf("Bars close and the side streets go quiet", "Robberies reported here in local news", "Poor street lighting"),
            ),
            SafetyZone(
                name = "Lapa nightlife area",
                level = ZoneLevel.Careful,
                polygon = listOf(listOf(-22.9125, -43.1815), listOf(-22.9120, -43.1785), listOf(-22.9145, -43.1780), listOf(-22.9150, -43.1810)),
                riskyFromHour = 22, riskyToHour = 5,
                reasons = listOf("Crowded at night, watch for pickpockets"),
            ),
            SafetyZone(
                name = "Av. Mem de Sá",
                level = ZoneLevel.Safer,
                polygon = listOf(listOf(-22.91095, -43.186), listOf(-22.91213, -43.177), listOf(-22.91259, -43.177), listOf(-22.91141, -43.186)),
                reasons = listOf("Main avenue, busy and lit late"),
            ),
        ),
        builtAtMillis = 0,
        scams = rioScams,
    )
}

// Demo scam warnings for Rio. Prices and rates are approximate, for the demo; real packs get them from ScamResearcher.
private val rioScams = listOf(
    ScamWarning(
        title = "Unofficial airport taxis", kind = ScamKind.Taxi, where = "Galeão airport arrivals",
        signs = listOf("driver approaches you inside the terminal", "no meter", "price given only after you get in"),
        whatToDo = "Use the official taxi desk or a ride app, and agree the price before you go.",
        level = ScamLevel.Careful,
        fairPrices = listOf(FairPrice("taxi airport to Lapa", "BRL", 90.0, 130.0)),
        sources = listOf("https://www.reddit.com/r/rio/search/?q=airport+taxi"), reports = 3,
    ),
    ScamWarning(
        title = "Card machine overcharge at beach kiosks", kind = ScamKind.Shop, where = "Copacabana and Ipanema beach kiosks",
        signs = listOf("card machine turned away from you", "screen covered", "asked to type the PIN twice"),
        whatToDo = "Read the amount on the screen before you pay, or pay in cash.",
        level = ScamLevel.Avoid,
        sources = listOf("https://www.reddit.com/r/rio/search/?q=card+machine"), reports = 4,
    ),
    ScamWarning(
        title = "Street money changers", kind = ScamKind.Money, where = "Copacabana and Centro sidewalks",
        signs = listOf("cambio offered on the street", "better rate than the banks", "counting notes fast"),
        whatToDo = "Change money at a bank or an official casa de câmbio, or use an ATM inside a bank.",
        level = ScamLevel.Avoid,
        fairRates = listOf(FairRate("USD", "BRL", 5.40, 8)),
        sources = listOf("https://www.reddit.com/r/travel/search/?q=rio+money+exchange"), reports = 3,
    ),
    ScamWarning(
        title = "\"Free\" bracelet or gift, then a demand for money", kind = ScamKind.Other, where = "Lapa steps and beach promenades",
        signs = listOf("ties a bracelet on your wrist", "free gift", "asks for money after"),
        whatToDo = "Keep your hands to yourself, say \"Não, obrigado\" and keep walking.",
        level = ScamLevel.Careful,
        sources = listOf("https://www.reddit.com/r/solotravel/search/?q=rio+bracelet"), reports = 2,
    ),
)
