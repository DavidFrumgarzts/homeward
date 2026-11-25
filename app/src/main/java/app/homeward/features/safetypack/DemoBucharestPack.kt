package app.homeward.features.safetypack

import app.homeward.features.scancheck.FairRate
import app.homeward.features.scancheck.ScamKind
import app.homeward.features.scancheck.ScamLevel
import app.homeward.features.scancheck.ScamWarning

// Hand-made pack for the scan-check demo (Bucharest money exchange). Numbers and coordinates are approximate.
// Real users get a pack built by SafetyPackBuilder + ScamResearcher. Check numbers before relying on them.
object DemoBucharestPack {
    private const val BANK = "BCR bank ATM, Bd. Regina Elisabeta"

    val pack = SafetyPack(
        city = "Bucharest",
        country = "Romania",
        police = "112",
        ambulance = "112",
        embassyName = "U.S. Embassy Bucharest",
        embassyPhone = "+40 21 200 3300",
        localPhrases = listOf(
            Phrase("Help!", "Ajutor!"),
            Phrase("Call the police", "Chemați poliția"),
            Phrase("No, thank you", "Nu, mulțumesc"),
        ),
        safePlaces = listOf(
            SafePlace(BANK, "bank", 44.4355, 26.0985, open24h = true, note = "ATM inside the bank lobby"),
            SafePlace("Police station, Old Town", "police", 44.4318, 26.1001, open24h = true),
            SafePlace("Spitalul Universitar de Urgență", "hospital", 44.4359, 26.0700, open24h = true),
        ),
        zones = listOf(
            SafetyZone(
                name = "Gara de Nord surroundings",
                level = ZoneLevel.Careful,
                polygon = listOf(listOf(44.4470, 26.0700), listOf(44.4470, 26.0760), listOf(44.4440, 26.0760), listOf(44.4440, 26.0700)),
                riskyFromHour = 22, riskyToHour = 5,
                reasons = listOf("Quiet after dark, pickpockets reported"),
            ),
        ),
        builtAtMillis = 0,
        scams = listOf(
            ScamWarning(
                title = "Exchange offices with \"0% commission\" signs", kind = ScamKind.Money,
                where = "Old Town (Lipscani) and around Piața Unirii",
                signs = listOf("0% commission", "big SELL rate, small BUY rate", "rate shown only for large amounts"),
                whatToDo = "Use a bank ATM and decline the conversion the machine offers.",
                saferOption = BANK, level = ScamLevel.Avoid,
                fairRates = listOf(FairRate("EUR", "RON", 4.97, 8), FairRate("USD", "RON", 4.60, 8)),
                sources = listOf("https://www.reddit.com/r/Romania/search/?q=exchange+office", "https://www.reddit.com/r/travel/search/?q=bucharest+exchange"),
                reports = 3,
            ),
            ScamWarning(
                title = "Airport arrivals exchange desks", kind = ScamKind.Money, where = "Otopeni airport arrivals hall",
                signs = listOf("airport exchange", "no commission", "rate much lower than in town"),
                whatToDo = "Change only what you need for the trip into town, or use a bank ATM.",
                saferOption = BANK, level = ScamLevel.Careful,
                fairRates = listOf(FairRate("EUR", "RON", 4.97, 8)),
                sources = listOf("https://www.reddit.com/r/Romania/search/?q=otopeni+exchange"), reports = 2,
            ),
        ),
    )
}
