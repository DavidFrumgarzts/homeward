package app.homeward.features.scancheck

import kotlinx.serialization.Serializable

// A scam travelers report in this city, saved in the pack (researched online by ScamResearcher).
// Describes a PRACTICE and a PLACE, never people. Numbers here are what ScanJudge compares against.
@Serializable
data class ScamWarning(
    val title: String,              // "Exchange offices with '0% commission' signs"
    val kind: ScamKind,
    val where: String,              // "Old Town (Lipscani), Gara de Nord"
    val signs: List<String>,        // what it looks like on the street
    val whatToDo: String,           // "Use a bank ATM and decline the conversion"
    val saferOption: String = "",   // a safePlaces name when one fits, else plain text
    val level: ScamLevel,
    val fairRates: List<FairRate> = emptyList(),   // Money only
    val fairPrices: List<FairPrice> = emptyList(), // taxi fare, camel ride, entry ticket
    val sources: List<String>,      // URLs the research used (Reddit threads allowed)
    val reports: Int = 0,           // independent sources that mention it
)

// 1 `from` = `rate` `to` (1 EUR = 4.97 RON). Losing more than walkAwayLossPercent means "Walk away".
@Serializable
data class FairRate(val from: String, val to: String, val rate: Double, val walkAwayLossPercent: Int = 8)

// A fair price range for one thing, e.g. camel ride 300..500 EGP.
@Serializable
data class FairPrice(val item: String, val currency: String, val low: Double, val high: Double)

@Serializable
enum class ScamKind { Money, Taxi, Tour, Shop, Ticket, Other }

@Serializable
enum class ScamLevel { Careful, Avoid }
