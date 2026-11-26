package app.homeward.features.scancheck

import app.homeward.features.safetypack.SafetyPack

// PURE LOGIC: when to research scams. Online only, only while the pack has none, at most once a day,
// and never within 2 hours of an SOS (the phone's data and battery are hers then).
object ScamResearchSchedule {
    private const val DAY_MILLIS = 24 * 60 * 60 * 1000L
    private const val AFTER_SOS_MILLIS = 2 * 60 * 60 * 1000L

    fun shouldTry(pack: SafetyPack, lastTryMillis: Long, nowMillis: Long, online: Boolean, sosSentMillis: Long? = null): Boolean =
        online && pack.scams.isEmpty() && nowMillis - lastTryMillis >= DAY_MILLIS &&
            (sosSentMillis == null || nowMillis - sosSentMillis >= AFTER_SOS_MILLIS)
}
