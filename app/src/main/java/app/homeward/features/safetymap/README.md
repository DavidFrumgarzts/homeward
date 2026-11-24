# features/safetymap/
- `ZoneChecker.kt`: pure logic. Inside a zone? Red zone ahead at this hour?
- `ZoneWarningWriter.kt`: on-device AI rephrases the saved reasons into one warning.
- `SafetyMapView.kt`: OpenStreetMap with zones drawn. Home uses it full-screen.
