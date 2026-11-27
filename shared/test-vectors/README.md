# shared/test-vectors

Input and expected output for Beacon's pure logic. Android, iOS and web each run these files in their unit tests and must get the same answers, so the three ports cannot drift apart.

## Format

Every file is:

```json
{ "logic": "ZoneChecker", "about": "what this covers",
  "cases": [ { "name": "...", "fn": "isInside", "input": { }, "tolerance": 1.0, "expected": true } ] }
```

- `fn` says which function the case calls (table below). `input` holds its arguments by name.
- `expected` is compared as JSON. Numbers may differ by `tolerance` when the case has one (metres worked out by different math libraries), and `3` equals `3.0`. Everything else, including every string, must match exactly.
- A point is `{ "lat", "lng" }`. A fix is `{ "point", "takenAtMillis", "accuracyMeters" }`. A profile is `{ "name", "pronoun": "UseName|She|He|They", "nationality" }`. Zones, places and phrases have the shapes in `shared/schema/safety-pack.schema.json`.
- Times of day in messages arrive as ready-made text (`"1:56 AM"`), so no platform formats a clock here.

| File | `fn` | Input | Expected |
|---|---|---|---|
| `zones.json` | `isInside` | `point`, `polygon` | boolean |
| | `isRiskyAt` | `riskyFromHour`, `riskyToHour`, `hour` | boolean |
| | `distanceToZone` | `point`, `polygon` | metres to the nearest edge, 0 inside |
| | `redZoneAhead` | `point`, `zones`, `hour`, `withinMeters` | zone name or null |
| `place-picker.json` | `isOpen` | `place`, `hour` | boolean |
| | `pick` | `here`, `places`, `hour` | `{ name, meters, reason }` or null |
| `approach-detector.json` | `sequence` | `warnWithinMeters`, `quietMinutes`, `zones`, `steps: [{ point, hour, nowMillis }]` fed in order to one fresh detector | zone name or null per step |
| `situation.json` | `pick` | `description` | situation key |
| | `checklist` | `situation` | the reviewed steps, in order |
| `phrase-picker.json` | `pick` | `description`, `situation`, `phrases` | one of the phrases, or null |
| `update-throttle.json` | `decide` | `lastSentFix` (or null), `lastSentAtMillis`, `fix`, `nowMillis`, `canSend`, `pointsHeld` | `{ decision: "send", pointsHeld }`, `{ decision: "hold" }` or `{ decision: "nothing" }` |
| `message-templates.json` | `short`, `mapsLink` | `point` | text |
| | `plainSentence` | `profile`, `description` | text |
| | `alert` | `profile`, `sentence`, `fix`, `fixTime`, `police`, `familyLink` | text |
| | `autoAlert` | `profile`, `checkTime`, `fix`, `fixTime`, `reasons`, `police`, `familyLink` | text |
| | `update` | `profile`, `fix`, `fixTime`, `pointsHeld` | text |
| | `batteryLow` | `profile`, `fix`, `fixTime` | text |
| | `ended` | `profile`, `time` | text |
| `delivery-wording.json` | `summarize` | `deliveries: [{ contactName, channel, status, updatedAtMillis }]` | `{ headline, lines, anyDelivered }` |
| `incident-machine.json` | `run` | `steps: [{ now, event }]`, starting from an inactive state | one snapshot per step |

## The state machine cases

An event is `{ "type": ... }` plus its fields: `StartSos { input }`, `RaiseSafetyCheck { input, urgent }`, `AnswerSafetyCheck { ok }`, `Tick`, `Describe { text, plainMessage }`, `MessageWritten { forDescription, message, ranOnDevice }`, `EditMessage { text }`, `Send { message }`, `Delivery { delivery }`, `UpdateConfirmed { atMillis }`, `Location { fix }`, `Signal { canSend }`, `Battery { percent }`, `ImOk`, `Cancel`, `Reset`. `input` is an incident input (`sessionId`, `method`, `userConfirmed`, `description`, `triggerReasons`, `location`, `online`, `startedAtMillis`).

The snapshot after each step has: `phase`, `effects` (in order; each `{ "type" }` plus `description` for `WriteMessage`, `message` for `SendAlert`, `pointsHeld` and `takenAtMillis` for `SendUpdate`, `hasFix` for `SendBatteryLow`, `urgent` for `AskSafetyCheck`), `method`, `userConfirmed`, `description`, `situation`, `message`, `messageRanOnDevice`, `writing`, `alertSent`, `deliveries` (as `"Name:Status"`, in the order held), `trail` (how many fixes are kept), `pointsHeld`, `canSend`, `lastSentAtMillis`, `lastUpdateConfirmedAtMillis`, `batteryLowSent`, `check` (`{ urgent, deadlineMillis, repeated }` or null) and `endedAtMillis`.

## Changing the logic

Android's Kotlin is the reference. After changing it on purpose, run (from `android/`) `BEACON_WRITE_FIXTURES=1 ./gradlew :app:testDebugUnitTest --tests 'app.homeward.shared.*'` to write the new expected values, read the diff, then update the iOS and web ports until their tests pass again.
