package app.homeward.features.scancheck

import app.homeward.features.safetypack.SafetyPack
import java.util.Locale
import kotlin.math.roundToInt

enum class Verdict(val label: String) {
    LooksFair("Looks fair"), BeCareful("Be careful"), WalkAway("Walk away"), Unknown("Nothing saved about this")
}

data class ScanVerdict(val verdict: Verdict, val why: String, val whatToDo: String, val saferOption: String, val warning: ScamWarning?)

// PURE LOGIC: decides Looks fair / Be careful / Walk away from what she confirmed and what the pack saved.
// No AI here: rates and prices are compared with numbers saved online. Tested in ScanJudgeTest.
object ScanJudge {
    private const val FAIR_LOSS_PERCENT = 3
    private const val CAREFUL_PRICE_FACTOR = 1.5

    fun judge(reading: ScanReading, pack: SafetyPack): ScanVerdict =
        judgeMoney(reading, pack) ?: judgePrice(reading, pack) ?: judgeBySigns(reading, pack) ?: unknown(reading.kind)

    private fun judgeMoney(reading: ScanReading, pack: SafetyPack): ScanVerdict? {
        for (board in reading.rates) {
            val buy = board.buy ?: continue
            for (w in pack.scams) {
                val fair = w.fairRates.firstOrNull { it.from.equals(board.from, true) && it.to.equals(board.to, true) } ?: continue
                val loss = ((fair.rate - buy) / fair.rate * 100).roundToInt()
                val verdict = when {
                    loss < FAIR_LOSS_PERCENT -> Verdict.LooksFair
                    loss <= fair.walkAwayLossPercent -> Verdict.BeCareful
                    else -> Verdict.WalkAway
                }
                val from = fair.from; val to = fair.to
                val why = "They buy 1 $from for ${n2(buy)} $to. A fair rate is about ${n2(fair.rate)}." +
                    if (loss > 0) " You'd lose about $loss% (100 $from → ${(buy * 100).roundToInt()} $to, not ${(fair.rate * 100).roundToInt()})." else ""
                return verdictFrom(verdict, why, w)
            }
        }
        return null
    }

    private fun judgePrice(reading: ScanReading, pack: SafetyPack): ScanVerdict? {
        for (seen in reading.prices) for (w in pack.scams) {
            // A typed price has no item name: then the warning's kind has to match instead (a Tour price vs. a camel ride).
            val fair = w.fairPrices.firstOrNull {
                it.currency.equals(seen.currency, true) && if (seen.item.isBlank()) w.kind == reading.kind else sameThing(it.item, seen.item)
            } ?: continue
            val verdict = when {
                seen.amount <= fair.high -> Verdict.LooksFair
                seen.amount <= fair.high * CAREFUL_PRICE_FACTOR -> Verdict.BeCareful
                else -> Verdict.WalkAway
            }
            val why = "They ask ${n0(seen.amount)} ${fair.currency} for ${fair.item}. A fair price is about ${n0(fair.low)}–${n0(fair.high)} ${fair.currency}."
            return verdictFrom(verdict, why, w)
        }
        return null
    }

    // No numbers to compare: match what the sign says against the warnings' signs. Never "Looks fair" from words alone.
    private fun judgeBySigns(reading: ScanReading, pack: SafetyPack): ScanVerdict? {
        val text = reading.text.lowercase(Locale.ROOT)
        if (text.isBlank()) return null
        val seen = words(text)
        val best = pack.scams.map { w ->
            val phrase = w.signs.any { it.isNotBlank() && text.contains(it.lowercase(Locale.ROOT)) }
            val shared = (words(w.title) + w.signs.flatMap { words(it) }).toSet().intersect(seen).size
            w to (if (phrase) 10 else 0) + shared + (if (w.kind == reading.kind) 1 else 0)
        }.filter { (w, score) -> score >= 10 || score - (if (w.kind == reading.kind) 1 else 0) >= 2 }
            .maxByOrNull { it.second }?.first ?: return null
        val verdict = if (best.level == ScamLevel.Avoid) Verdict.WalkAway else Verdict.BeCareful
        return verdictFrom(verdict, "${best.title}, reported in ${best.where}.", best)
    }

    private fun verdictFrom(verdict: Verdict, why: String, w: ScamWarning) =
        ScanVerdict(verdict, why, w.whatToDo, w.saferOption, w)

    private fun unknown(kind: ScamKind) = ScanVerdict(Verdict.Unknown, Verdict.Unknown.label, generalTip(kind), "", null)

    fun generalTip(kind: ScamKind) = when (kind) {
        ScamKind.Money -> "Use a bank ATM and decline the conversion it offers."
        ScamKind.Taxi -> "Use the official taxi desk or a ride app, and agree the price first."
        ScamKind.Tour -> "Agree the full price before you start."
        ScamKind.Shop -> "Check the amount on the card machine before you pay."
        ScamKind.Ticket -> "Buy tickets only at the official counter."
        ScamKind.Other -> "If someone insists, say no and keep walking."
    }

    private fun sameThing(a: String, b: String) = words(a).intersect(words(b)).isNotEmpty()
    // Common words don't count as a match ("the", "you", "for"...), or any sign would trigger a warning.
    private val stopwords = setOf("the", "you", "your", "for", "and", "with", "only", "this", "that", "are", "from", "not", "after", "before", "please", "thank", "than", "get", "its", "our")
    private fun words(s: String) = s.lowercase(Locale.ROOT).split(Regex("[^\\p{L}\\p{N}%]+")).filter { it.length >= 3 && it !in stopwords }.toSet()
    private fun n2(x: Double) = String.format(Locale.ROOT, "%.2f", x)
    private fun n0(x: Double) = x.roundToInt().toString()
}
