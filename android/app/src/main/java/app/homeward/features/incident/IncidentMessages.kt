package app.homeward.features.incident

import app.homeward.device.MapsLink
import app.homeward.features.incident.contracts.LocationFix
import app.homeward.profile.UserProfile

// PURE LOGIC: every text a trusted contact can receive during an incident, in the order they arrive:
// the alert, location updates, a low-battery note, and the "ended" message.
// Phone numbers, coordinates, links and times are put in HERE, by code. The AI only ever rewrites the
// sentence about what is happening, and never sees or writes these facts.
// Times are passed in as ready-made text ("11:42 PM") so tests and other platforms get identical output.
// Tested in IncidentMessagesTest and shared/test-vectors/message-templates.json.
object IncidentMessages {

    // The sentence used when no AI is available, or before it has answered.
    fun plainSentence(profile: UserProfile, description: String): String {
        val note = description.trim().trimEnd('.', '!', ',', ';')
        return if (note.isEmpty()) "${profile.displayName} needs help." else "${profile.displayName} needs help: $note."
    }

    // The full alert: what is happening, where and when, the live link (once there is one), what to do.
    fun alert(profile: UserProfile, sentence: String, fix: LocationFix?, fixTime: String?, police: String, familyLink: String? = null): String =
        listOfNotNull(
            sentence.trim(),
            where(fix, fixTime, label = "Location"),
            familyLink?.let { "Follow live: $it" },
            callLine(profile, police),
        ).joinToString("\n")

    // Sent only when she did not answer an urgent safety check. Fixed wording, no AI, and it never
    // says a crime is happening: only what Beacon saw.
    fun autoAlert(profile: UserProfile, checkTime: String, fix: LocationFix?, fixTime: String?, reasons: List<String>, police: String, familyLink: String? = null): String =
        listOfNotNull(
            "Beacon safety check: ${profile.displayName} did not respond to a safety check at $checkTime.",
            where(fix, fixTime, label = "Last location"),
            reasons.takeIf { it.isNotEmpty() }?.let { "Why Beacon asked: ${it.joinToString("; ")}." },
            familyLink?.let { "Follow live: $it" },
            callLine(profile, police),
        ).joinToString("\n")

    fun update(profile: UserProfile, fix: LocationFix, fixTime: String, pointsHeld: Int): String {
        val held = if (pointsHeld > 0) "\n$pointsHeld location ${if (pointsHeld == 1) "point was" else "points were"} recorded while there was no signal." else ""
        return "Beacon update: ${profile.displayName} was here at $fixTime.\n${fix.point.short()}\n${MapsLink.of(fix.point)}$held"
    }

    fun batteryLow(profile: UserProfile, fix: LocationFix?, fixTime: String?): String =
        listOfNotNull(
            "Beacon: ${profile.displayName}'s phone battery is low. Updates may stop.",
            where(fix, fixTime, label = "Last known location"),
        ).joinToString("\n")

    fun ended(profile: UserProfile, time: String): String =
        "Beacon: ${profile.displayName} says the SOS is over ($time). Beacon has stopped sharing ${profile.possessive} location."

    private fun callLine(profile: UserProfile, police: String) =
        "Call ${profile.objectForm} now. If there is no answer, call $police (police)."

    // "Location: -22.9133, -43.1801 at 11:42 PM" + the map link; says so plainly when there is no fix.
    private fun where(fix: LocationFix?, fixTime: String?, label: String): String =
        if (fix == null) "$label: unknown (no GPS fix yet)."
        else "$label: ${fix.point.short()}${fixTime?.let { " at $it" }.orEmpty()}\nMap: ${MapsLink.of(fix.point)}"
}
