package app.homeward.features.osmplaces

// PURE LOGIC: turns OpenStreetMap's opening_hours text into what SafePlacePicker needs.
// Handles the common cases: "24/7" and a simple "08:00-22:00" range. Anything else = unknown.
object OpeningHours {
    data class Hours(val open24h: Boolean, val opensHour: Int, val closesHour: Int, val known: Boolean)

    private val range = Regex("""(\d{1,2}):\d{2}\s*-\s*(\d{1,2}):\d{2}""")

    fun parse(text: String?, kind: String): Hours {
        if (text?.trim() == "24/7") return Hours(true, 0, 24, true)
        range.find(text.orEmpty())?.let { m ->
            val open = m.groupValues[1].toInt().coerceIn(0, 23)
            val close = m.groupValues[2].toInt().let { if (it == 0) 24 else it }.coerceIn(1, 24)
            return Hours(false, open, close, true)
        }
        // Not listed. Hospitals have 24h emergency rooms; for the rest assume daytime only, to be safe.
        return if (kind == "hospital") Hours(true, 0, 24, false) else Hours(false, 8, 20, false)
    }
}
