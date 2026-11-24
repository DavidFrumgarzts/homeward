package app.homeward

import app.homeward.features.scancheck.ScamKind
import app.homeward.features.scancheck.ScanReadingParser
import org.junit.Assert.*
import org.junit.Test

// The on-device model's answer is messy text. The parser must never crash and never invent numbers.
class ScanReadingParserTest {
    @Test fun specShapeParses() {
        val r = ScanReadingParser.parse(
            """{"kind":"Money","text":"0% commission","rates":[{"from":"EUR","to":"RON","buy":4.20,"sell":5.10}],
               "prices":[{"item":"camel ride","currency":"EGP","amount":1500}]}"""
        )!!
        assertEquals(ScamKind.Money, r.kind)
        assertEquals(4.20, r.rates.single().buy!!, 0.0001)
        assertEquals(5.10, r.rates.single().sell!!, 0.0001)
        assertEquals(1500.0, r.prices.single().amount, 0.0001)
    }

    @Test fun fencedJsonWithASentenceParses() {
        val r = ScanReadingParser.parse("Sure! Here it is:\n```json\n{\"kind\":\"Taxi\",\"text\":\"meter\"}\n```\nHope that helps.")
        assertEquals(ScamKind.Taxi, r!!.kind)
    }

    @Test fun commaDecimalsAndLowerCaseCurrency() {
        val r = ScanReadingParser.parse("""{"kind":"money","rates":[{"from":"eur","to":"ron","buy":"4,20"}]}""")!!
        assertEquals(4.20, r.rates.single().buy!!, 0.0001)
        assertEquals("EUR", r.rates.single().from)
        assertEquals("RON", r.rates.single().to)
    }

    @Test fun thousandsCommaIsNotADecimal() {
        assertEquals(1500.0, ScanReadingParser.number("1,500")!!, 0.0001)
        assertEquals(4.20, ScanReadingParser.number("4,20")!!, 0.0001)
        assertEquals(4.5, ScanReadingParser.number("4,5")!!, 0.0001)
    }

    @Test fun unknownKindIsOther() = assertEquals(ScamKind.Other, ScanReadingParser.parse("""{"kind":"Spaceship"}""")!!.kind)

    @Test fun noJsonIsNull() = assertNull(ScanReadingParser.parse("I can't read this photo."))

    @Test fun missingRatesIsEmpty() = assertTrue(ScanReadingParser.parse("""{"kind":"Money","text":"cambio"}""")!!.rates.isEmpty())

    @Test fun rateWithoutCurrenciesIsDropped() =
        assertTrue(ScanReadingParser.parse("""{"kind":"Money","rates":[{"buy":4.2}]}""")!!.rates.isEmpty())
}
