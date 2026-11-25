package app.homeward.features.scancheck

import android.graphics.Bitmap
import app.homeward.ai.AiModels
import app.homeward.ai.askAboutImage

data class ScanRead(val reading: ScanReading?, val ranOnDevice: Boolean)

// HYBRID AI (on the phone when it can): reads a photo of a board, meter, ticket or price list.
// It only READS and SORTS; it gives no advice and decides nothing. ScanJudge decides, after she confirms.
// Called only when she taps, never in a loop (on-device quotas). Any failure -> she types it instead.
object ScanReader {
    const val PROMPT = """Read this photo for a traveler. Only write what is visible; do not give advice.
Return ONLY JSON in this shape:
{"kind": "Money|Taxi|Tour|Shop|Ticket|Other",
 "text": "what the sign or board says, max 40 words",
 "rates": [{"from": "EUR", "to": "RON", "buy": 4.20, "sell": 5.10}],
 "prices": [{"item": "camel ride", "currency": "EGP", "amount": 1500}]}
Use 3-letter currency codes. "buy" is what they pay you for 1 unit of "from". Leave a list empty if there is nothing like it."""

    suspend fun read(photo: Bitmap): ScanRead =
        runCatching { AiModels.hybrid.askAboutImage(photo, PROMPT) }
            .map { ScanRead(ScanReadingParser.parse(it.text), it.ranOnDevice) }
            .getOrDefault(ScanRead(null, ranOnDevice = false))
}
