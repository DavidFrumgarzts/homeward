package app.homeward.features.safetypack

// Hand-made pack for the demo (Lapa, Rio de Janeiro). Real users get a pack built by SafetyPackBuilder.
// Check numbers before relying on them.
//
// Places and zones sit where the illustrated Lapa map draws them (features/lapamap), so the green dot,
// the red patch and the warnings agree. The drawing is stylized, so these coordinates are approximate.
//
// This is the source of shared/fixtures/rio-lapa-pack.json, which iOS and web load. DemoPackFixtureTest
// fails if the two differ; run it with BEACON_WRITE_FIXTURES=1 to write the file again after a change here.
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
            SafePlace("5º DP police station", "police", -22.91255, -43.1803, open24h = true),
            SafePlace("Hospital Cruz Vermelha", "hospital", -22.91297, -43.18456, open24h = true),
        ),
        zones = listOf(
            SafetyZone(
                name = "Rua dos Inválidos",
                level = ZoneLevel.Avoid,
                polygon = listOf(listOf(-22.90838, -43.18348), listOf(-22.90838, -43.18149), listOf(-22.91125, -43.18149), listOf(-22.91125, -43.18348)),
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
                polygon = listOf(listOf(-22.91095, -43.186), listOf(-22.91213, -43.177), listOf(-22.91259, -43.177), listOf(-22.91141, -43.186)),
                reasons = listOf("Main avenue, busy and lit late"),
            ),
        ),
        builtAtMillis = 0,
    )
}
