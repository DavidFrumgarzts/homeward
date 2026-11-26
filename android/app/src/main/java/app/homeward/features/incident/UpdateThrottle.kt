package app.homeward.features.incident

import app.homeward.features.incident.contracts.LocationFix

// PURE LOGIC: while an SOS is active, decides when contacts get a location update.
//   - Send when she has moved more than 200 m, or 5 minutes have passed, whichever comes first.
//   - Never more than one text every 2 minutes.
//   - With no signal nothing can go out, so points are only counted. When signal is back, ONE text
//     goes out with the latest fix and how many points were recorded, not a flood.
// Time and place are passed in so tests control them. Tested in UpdateThrottleTest and
// shared/test-vectors/update-throttle.json.
object UpdateThrottle {
    const val MOVED_METERS = 200.0
    const val EVERY_MILLIS = 5 * 60_000L
    const val MIN_GAP_MILLIS = 2 * 60_000L

    sealed interface Decision {
        data object Nothing : Decision                 // too soon, or she hasn't moved enough
        data object Hold : Decision                    // no signal: count this point, send later
        data class Send(val pointsHeld: Int) : Decision // send now; pointsHeld > 0 after a gap with no signal
    }

    fun decide(
        lastSentFix: LocationFix?,   // where the last message (alert or update) placed her; null = none had a location
        lastSentAtMillis: Long,      // when the last message went out
        fix: LocationFix,
        nowMillis: Long,
        canSend: Boolean,            // is there signal for a text right now?
        pointsHeld: Int,             // points already counted while there was no signal
    ): Decision {
        if (!canSend) return Decision.Hold
        val sinceLast = nowMillis - lastSentAtMillis
        if (sinceLast < MIN_GAP_MILLIS) return Decision.Nothing
        if (pointsHeld > 0) return Decision.Send(pointsHeld)
        val moved = lastSentFix?.point?.metersTo(fix.point) ?: Double.MAX_VALUE
        return if (moved > MOVED_METERS || sinceLast >= EVERY_MILLIS) Decision.Send(0) else Decision.Nothing
    }
}
