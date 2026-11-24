package app.homeward.contacts

// PURE LOGIC: cleans up a typed phone number and checks it can receive an SMS.
// Keeps a leading "+" and digits only. International format (+country code) is required,
// because travelers' contacts are usually in another country. Tested in PhoneNumberTest.
object PhoneNumber {
    fun clean(raw: String): String {
        val trimmed = raw.trim()
        val digits = trimmed.filter { it.isDigit() }
        return if (trimmed.startsWith("+")) "+$digits" else digits
    }

    // E.164: "+" then 8 to 15 digits, e.g. +972501234567 or +12035551234.
    fun isValid(raw: String): Boolean {
        val c = clean(raw)
        return c.startsWith("+") && c.length - 1 in 8..15
    }
}
