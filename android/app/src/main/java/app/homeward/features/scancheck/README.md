# scancheck

The scan check: point the camera at a money board, meter, price list or ticket and Beacon says
Looks fair, Be careful or Walk away, offline, from scam reports saved in the pack. Spec: `docs/specs/2026-11-24-scan-check-addendum.md`.

- `ScamWarning.kt`: what the pack stores about a reported scam: where, signs, what to do, fair rates and prices, sources.
- `ScanReading.kt`: what a scan saw (kind, text, board rates, prices), after she confirms it.
- `ScanJudge.kt`: PURE LOGIC, the verdict from saved fair rates, prices and signs. Tested in `ScanJudgeTest`.
- `RecommendedPlace.kt`: PURE LOGIC, the saved place Beacon recommends (decided in code), and finding a place by name. Tested in `RecommendedPlaceTest`.
- `ScanReadingParser.kt`: PURE LOGIC, turns the model's messy answer into a `ScanReading` (accepts "4,20", lower-case currencies). Tested in `ScanReadingParserTest`.
- `ScanReader.kt`: HYBRID AI, reads the photo (on the phone when it can). Reads only; decides nothing.
- `ScamResearchPrompt.kt`: the cloud prompt (Google Search; Reddit threads, forums, embassy advice; sources required).
- `ScamResearchParser.kt`: PURE LOGIC, research answer to `ScamWarning`s; drops broken or unsourced items.
- `ScamResearchSchedule.kt`: PURE LOGIC, when to research (online, pack has no scams, once a day per city).
- `ScamResearcher.kt`: CLOUD, runs the research from `PackUpdater` and saves the scams into the pack. Never throws.
- `ScanScreen.kt`: photo -> on-device read (or ask before the cloud, or type it) -> confirm -> verdict. Debug builds can switch to the Bucharest demo.
- `ScanConfirmForm.kt`: "We read" — she checks or types the kind and the number before anything is judged.
- `ScanVerdictCard.kt`: Looks fair / Be careful / Walk away, why, what to do, the safer place, and the pack source.
