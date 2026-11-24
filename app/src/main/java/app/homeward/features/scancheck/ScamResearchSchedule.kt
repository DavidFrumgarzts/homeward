package app.homeward.features.scancheck

import app.homeward.features.safetypack.SafetyPack

// PURE LOGIC: when to research scams. Online only, only while the pack has none, at most once a day.
object ScamResearchSchedule {
    private const val DAY_MILLIS = 24 * 60 * 60 * 1000L

    fun shouldTry(pack: SafetyPack, lastTryMillis: Long, nowMillis: Long, online: Boolean): Boolean =
        online && pack.scams.isEmpty() && nowMillis - lastTryMillis >= DAY_MILLIS
}
