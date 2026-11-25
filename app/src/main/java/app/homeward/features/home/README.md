# features/home/
Home is the map. One file per piece (Figma "07 Home"):
- `HomeScreen.kt`: puts the pieces together and handles taps. Shows the illustrated map (`lapamap/`) inside Lapa, the real street map (`safetymap/`) anywhere else.
- `RedZoneBanner.kt`: alert at the top when a red zone is close at night.
- `HomeBottomSheet.kt`: the sheet: Ask Beacon box, two ready-made questions, nearest open place to get help, I'm OK, Police, Hold for SOS (or "SOS is on" while one runs).
- `NearbyFeed.kt`: pure logic. Closest risky zone (status by hour) + nearest open safe place, and the `clock()` / `distance()` text helpers.
