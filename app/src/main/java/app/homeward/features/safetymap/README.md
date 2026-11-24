# features/safetymap/
- `ZoneChecker.kt`: pure logic. Inside a zone? Red zone ahead at this hour? Distance to its nearest edge.
- `ApproachDetector.kt`: pure logic. Buzz only when walking TOWARD a risky red zone, once per zone per 15 min.
- `ZoneWarningWriter.kt`: on-device AI rephrases the saved reasons into one warning.
- `SafetyMapView.kt`: the map with zones drawn. Home uses it full-screen.
