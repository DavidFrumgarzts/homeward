package app.beacon.features.safetypack

// Hand-made pack for the demo video (Lapa, Rio de Janeiro). Coordinates are approximate.
// Real users get a pack built by SafetyPackBuilder. Check numbers before relying on them.
object DemoRioPack {
    val pack = SafetyPack(
        city = "Rio de Janeiro",
        country = "Brazil",
        police = "190",
        ambulance = "192",
        embassyName = "U.S. Consulate General Rio de Janeiro",
        embassyPhone = "+55 21 3823-2000",
        localPhrases = listOf(
            Phrase("Help!", "Socorro!"),
            Phrase("Call the police", "Chame a polícia"),
            Phrase("I am being followed", "Estou sendo seguida"),
            Phrase("I need a hospital", "Preciso de um hospital"),
        ),
        safePlaces = listOf(
            SafePlace("Shell gas station", "gas station", -22.9116, -43.1817, open24h = true, note = "main road, well lit"),
            SafePlace("Police post Lapa", "police", -22.9128, -43.1792, open24h = false, opensHour = 8, closesHour = 22),
            SafePlace("Hospital Souza Aguiar", "hospital", -22.9079, -43.1885, open24h = true, note = "large public hospital"),
        ),
        zones = listOf(
            SafetyZone(
                name = "Rua dos Inválidos",
                level = ZoneLevel.Avoid,
                polygon = listOf(listOf(-22.9105, -43.1860), listOf(-22.9100, -43.1830), listOf(-22.9125, -43.1825), listOf(-22.9130, -43.1855)),
                riskyFromHour = 23, riskyToHour = 5,
                reasons = listOf("Bars close and the side streets go quiet", "Robberies reported here in local news", "Poor street lighting"),
            ),
            SafetyZone(
                name = "Lapa nightlife area",
                level = ZoneLevel.Careful,
                polygon = listOf(listOf(-22.9125, -43.1815), listOf(-22.9120, -43.1785), listOf(-22.9145, -43.1780), listOf(-22.9150, -43.1810)),
                riskyFromHour = 22, riskyToHour = 5,
                reasons = listOf("Crowded at night, watch for pickpockets"),
            ),
            SafetyZone(
                name = "Av. Mem de Sá",
                level = ZoneLevel.Safer,
                polygon = listOf(listOf(-22.9135, -43.1870), listOf(-22.9130, -43.1820), listOf(-22.9140, -43.1818), listOf(-22.9145, -43.1868)),
                reasons = listOf("Main avenue, busy and lit late"),
            ),
        ),
        builtAtMillis = 0,
    )
}
