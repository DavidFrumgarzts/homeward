package app.homeward.features.scancheck

// What a scan saw (read by the on-device AI, then confirmed or typed by the traveler).
// Numbers in here are HER confirmed input; ScanJudge compares them with the pack.
data class ScanReading(
    val kind: ScamKind,
    val text: String = "",                       // what the sign or board says, short
    val rates: List<BoardRate> = emptyList(),    // money boards
    val prices: List<SeenPrice> = emptyList(),   // meters, price lists, offers
)

// One line of an exchange board: they BUY 1 `from` for `buy` `to` (what she gets), and SELL for `sell`.
data class BoardRate(val from: String, val to: String, val buy: Double? = null, val sell: Double? = null)

data class SeenPrice(val item: String, val currency: String, val amount: Double)
