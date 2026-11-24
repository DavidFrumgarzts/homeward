package app.homeward.features.sos

// PURE LOGIC: the one line on the active SOS screen that says what is happening with her location.
// It only claims an update was sent when the radio confirmed one. Tested in SessionWordingTest.
object SessionWording {
    fun locationLine(hasFix: Boolean, fixAgeMinutes: Long?, lastUpdateTime: String?, pointsWaiting: Int): String = when {
        !hasFix -> "No GPS fix yet. Your message says so. Step outside or near a window if you can."
        pointsWaiting > 0 -> "$pointsWaiting location ${if (pointsWaiting == 1) "point" else "points"} saved on your phone. They go out in one text when you have signal."
        lastUpdateTime != null -> "Last location update sent at $lastUpdateTime. The next goes after 200 m or 5 minutes."
        fixAgeMinutes != null && fixAgeMinutes >= 2 -> "Your last GPS fix is $fixAgeMinutes minutes old. Updates go out when you move 200 m, or every 5 minutes."
        else -> "Your contacts get a location update when you move 200 m, or every 5 minutes."
    }
}
