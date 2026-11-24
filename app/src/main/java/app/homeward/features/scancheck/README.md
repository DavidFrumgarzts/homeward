# scancheck

The scan check: point the camera at a money board, meter, price list or ticket and Beacon says
Looks fair, Be careful or Walk away, offline, from scam reports saved in the pack. Spec: `docs/specs/2026-11-24-scan-check-addendum.md`.

- `ScamWarning.kt`: what the pack stores about a reported scam: where, signs, what to do, fair rates and prices, sources.
- `ScanReading.kt`: what a scan saw (kind, text, board rates, prices), after she confirms it.
- `ScanJudge.kt`: PURE LOGIC, the verdict from saved fair rates, prices and signs. Tested in `ScanJudgeTest`.
