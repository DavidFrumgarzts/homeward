# features/safetypack/
- `SafetyPack.kt`: the data (numbers, phrases, safe places, zones).
- `SafetyPackPrompt.kt`: instructions for the cloud model. `SafetyPackBuilder.kt`: cloud + Google Search -> pack.
- `PackUpdater.kt`: builds a pack when you're online in a new city. `SafetyPackStore.kt`: saves it as a file (offline). Also runs `scancheck/ScamResearcher` for reported scams.
- `DemoRioPack.kt`: hand-made Lapa, Rio pack for the demo.
- `DemoBucharestPack.kt`: hand-made Bucharest pack for the scan-check demo (money exchange).
