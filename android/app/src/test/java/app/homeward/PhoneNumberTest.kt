package app.homeward

import app.homeward.contacts.PhoneNumber
import org.junit.Assert.*
import org.junit.Test

// Checks phone numbers are cleaned and must be international so SMS works across countries.
class PhoneNumberTest {
    @Test fun cleansSpacesAndDashes() = assertEquals("+972501234567", PhoneNumber.clean(" +972 50-123-4567 "))
    @Test fun acceptsInternational() = assertTrue(PhoneNumber.isValid("+1 203 555 1234"))
    @Test fun rejectsWithoutCountryCode() = assertFalse(PhoneNumber.isValid("050-123-4567"))
    @Test fun rejectsTooShort() = assertFalse(PhoneNumber.isValid("+12345"))
}
