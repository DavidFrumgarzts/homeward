# Add-on: Scan check and the yellow "go here" blink

An addition to `docs/specs/2026-11-24-beacon-build-prompt.md` (branch `beacon/build-prompt`). It does not change
anything in that prompt. Every rule in its section 3 and every platform fact in its section 4 apply here too.
If the two documents ever disagree, the build prompt wins, and the disagreement goes in the plan.

## 1. Why

Most things that go wrong for a traveler are not attacks. They are a money changer with an awful rate behind a
"0% commission" sign in Bucharest, a camel ride at Giza whose price triples halfway, a taxi with a rigged meter.
Travelers write about these all the time (Reddit, forums, embassy pages), but you can't search for them while
someone is waving you over and you have no signal.

Beacon already prepares online and helps offline. The scan check uses the same pattern for scams: while she has
wifi, the cloud model with Google Search collects what travelers report for the city and saves it in the pack.
On the street, with no signal, she points the camera at the thing, and the phone's model reads the photo and
checks it against that saved knowledge. (The same idea as the Trail demo: knowledge built online, photo answered
on the device.)

The second part is small. When Beacon recommends a place to go ("Walk to 5º DP police station"), that place
flashes yellow on the map so she can find it at a glance.

## 2. Goals, non-goals, anti-goals

**Goals**
- One tap from Home to the camera, and an answer in a few seconds, with no signal: **Looks fair**, **Be careful**
  or **Walk away**, with one line of why and one line of what to do instead.
- Money boards get numbers, not adjectives: "They buy 1 EUR for 4.20 RON. A fair rate is about 4.97. You'd lose about 15%."
- Every warning shows where it came from ("From your Bucharest pack, saved on wifi · 3 traveler reports").
- The recommended place blinks yellow on the map, both after Ask Beacon and after a scan.

**Non-goals (this deadline)**
- Live exchange rates while offline. The fair rate is the one saved when the pack was built, with its date.
- Recognising people, faces or uniforms. The scan looks at signs, boards, meters, tickets, menus and price lists.
- A Reddit API integration (see section 4).

**Anti-goals (would make it a failure even if it works)**
- The AI inventing a fair price or a rate. Numbers are compared by code, against numbers saved in the pack.
- Warnings about groups of people. Scams describe a practice and a place ("exchange offices on Lipscani street"),
  never who runs them. Same rule as zones.
- Saying "safe" as a guarantee. The good verdict is "Looks fair", never "Safe".
- Sending the photo anywhere without her knowing. Offline it never leaves the phone; online on a phone without
  Nano it goes to the cloud model, and the result shows the "Cloud" badge, like every other AI answer.

## 3. Approaches considered

| | Approach | Trade-off |
|---|---|---|
| A | Spec only; the build agent adds it with everything else | No clashes, but nothing to show until the agent gets there |
| **B (picked)** | **This spec, plus an Android build now on branch `beacon/scan-check`** | **Working feature this week; three small touch points to merge with Phase 1 work** |
| C | Spec, plus a web build first (Chrome's Gemini Nano reads images) | Fastest to demo in a browser, but web is the secondary platform |

David picked B. The Android build stays in its own folder and touches the existing app in only three places
(section 7), so the build agent's phases can merge it with little work. Web and iOS follow the same contract later.

## 4. Online: what goes into the pack

A new list in `SafetyPack`, with a default so saved packs still load:

```kotlin
val scams: List<ScamWarning> = emptyList()

@Serializable
data class ScamWarning(
    val title: String,              // "Exchange offices with '0% commission' signs"
    val kind: ScamKind,             // Money, Taxi, Tour, Shop, Ticket, Other
    val where: String,              // "Old Town (Lipscani), Gara de Nord" — places, never people
    val signs: List<String>,        // what it looks like: "board shows a big 'SELL' rate, tiny 'BUY' rate"
    val whatToDo: String,           // "Use a bank ATM and decline the conversion"
    val saferOption: String = "",   // a place name from safePlaces when one fits, else plain text
    val level: ScamLevel,           // Careful, Avoid
    val fairRates: List<FairRate> = emptyList(),   // only for Money
    val fairPrices: List<FairPrice> = emptyList(), // e.g. taxi airport->centre, camel ride, entry ticket
    val sources: List<String>,      // URLs the model actually used (Reddit threads allowed)
    val reports: Int = 0,           // how many independent sources mention it
)

@Serializable data class FairRate(val from: String, val to: String, val rate: Double, val walkAwayLossPercent: Int = 8)
@Serializable data class FairPrice(val item: String, val currency: String, val low: Double, val high: Double)
```

**Where it comes from.** A second cloud call, `ScamResearchPrompt`, on the existing `AiModels.cloudResearch`
(Gemini with Google Search). It runs right after the pack is built, in `PackUpdater`, on the same wifi. It is a
separate call so the pack research prompt (which the build prompt moves to structured output) is not touched.

- The prompt asks for scams that **travelers report**, and tells the model to look at Reddit threads (r/travel,
  r/solotravel and the city or country subreddit), travel forums, embassy and government advice. It keeps an
  item only if it has a source, and counts independent sources in `reports`.
- Reddit content is reached through Google Search grounding, not the Reddit API (which needs approved, paid
  access). Show the source links in the scan result so travelers can read the original.
- `fairRates` comes from the same search (central bank or a major rate site), with the date in the prompt.
  Save the date the pack was built; the scan result says "rate saved Nov 24".
- Use structured output (a response schema) where the SDK allows it with Google Search, as the build prompt asks
  for every cloud call that returns data; otherwise the existing `extractJson` parser.
- If the call fails, the pack is still saved without scams. Never fail the pack build because of this.
- **Existing packs.** `PackUpdater` skips cities that already have a pack, so scam research also runs, online only,
  when the saved pack's `scams` list is empty, at most once a day (keep the last try time in the store). Never during
  an SOS. *(Builder's call.)*

**Demo data.** `DemoRioPack` gets 4 to 6 Rio warnings (airport taxi, beach vendor card machine, street exchange,
"free" bracelet). A second demo pack, `DemoBucharestPack`, holds the money-exchange example used in the demo:
a fair EUR → RON rate and two warnings. Like `DemoRioPack`, its numbers are marked approximate in a comment.

## 5. Offline: the scan

**Flow.** Home → "Scan" quick action → the phone's camera app takes a full-size photo (`TakePicture` into a
`FileProvider` URI; no CAMERA permission needed) → Scan screen shows the photo with "Reading…" → verdict card.

**Step 1, read (on-device AI).** `ScanReader` sends the photo plus a short prompt to `AiModels.hybrid`
(`PREFER_ON_DEVICE`, one Bitmap, single turn, called only on her tap). The model only **reads and sorts**:

```json
{"kind": "Money|Taxi|Tour|Shop|Ticket|Other",
 "text": "what the sign or board says, max 40 words",
 "rates": [{"from": "EUR", "to": "RON", "buy": 4.20, "sell": 5.10}],
 "prices": [{"item": "camel ride", "currency": "EGP", "amount": 1500}]}
```

Parsed defensively (on-device output). **She confirms what was read before anything is judged:** the screen shows
"We read: buys 1 EUR for **4.20** RON" with the number editable, and a "Check it" button. This keeps the build
prompt's rule that model output is never trusted for values: the number she confirms is her input, the model only
pre-filled it. If the model is unavailable, the parse fails, or she is offline on a phone
without Nano: no AI, she picks what she's looking at (Money, Taxi, Tour, Shop, Ticket) and, for Money, types the
number on the board. The scan still works, just with one more tap.

**Before a photo goes to the cloud.** If the on-device model isn't ready (`OnDeviceModelSetup` status), the photo
would be read in the cloud. Then, before the call, one line asks: "No on-device AI on this phone. Read this photo in
the cloud?" with "Read in the cloud" and "Type it instead". Offline without Nano, she goes straight to typing.
*(Builder's call, made in the spec: the "Cloud" badge alone would tell her only after the photo was sent.)*

**Step 2, judge (pure logic, no AI).** `ScanJudge.judge(reading, pack, nowMillis)` → `ScanVerdict`:

- **Money:** for each rate on the board that matches a `FairRate` pair, loss = (fair − offered) / fair. Under 3%:
  Looks fair. Up to `walkAwayLossPercent`: Be careful. Above it: Walk away. The line says the numbers and the
  loss in plain words, and "for 100 EUR you'd get about 420 RON instead of 497".
- **Prices:** compare with `FairPrice` low/high. Inside: Looks fair. Up to 1.5× high: Be careful. Above: Walk away.
- **No numbers:** match `kind` and words of `text` against the pack's warnings' `title` and `signs`. A match
  gives that warning's `level` (Careful → Be careful, Avoid → Walk away). No match: "Nothing saved about this",
  with the closest general tip for that kind. Never "Looks fair" without a number to back it.
- The verdict always carries the matched `ScamWarning` (if any), `whatToDo`, and the `saferOption`.

Unit-tested in `ScanJudgeTest` with fixed packs and readings, including boundaries, unknown currencies, empty packs.

**Step 3, explain (optional on-device AI).** None needed for the demo: the verdict lines are templates filled by
`ScanJudge`. Only if time allows, `AiModels.hybrid` may reword them, with the template as the fallback.

**Verdict card** (same style as the rest: white card on warm paper, Sora heading, Inter body):

```
 [photo thumbnail]
 ● Walk away                                  On device
 They buy 1 EUR for 4.20 RON. A fair rate is about 4.97.
 You'd lose about 15% (100 EUR → 420 RON, not 497).

 What to do: use a bank ATM and decline the conversion.
 [ Show BCR bank ATM on the map ]            (blue button)

 From your Bucharest pack, saved Nov 24 · 3 traveler reports
 Sources ›
```

Colours: Looks fair uses green (`HomewardColors.Green`), Be careful uses yellow (`Yellow`), Walk away uses amber
(`Amber`). Red stays reserved for SOS, the police call and red zones, as the build prompt's rules say.

## 6. The yellow blink for a recommended place

**When.** Any time Beacon recommends a place from `pack.safePlaces`:
- **Ask Beacon:** the place comes from code, not from the answer text (the build prompt forbids parsing values out
  of model prose). `AskBeaconPrompt` already hands the model the closest open places, nearest first;
  `RecommendedPlace.pick(question, pack, here, hour)` (pure logic, tested) returns that same first place when the
  question is about where to go or what to do ("safe place", "where", "go", "help", "hostel", "police", "hospital",
  in English, or any answer to a scan), and the prompt tells the model to recommend that place first. When there is a
  pick, a small "Show on map" link appears under the answer bubble. *(Builder's call.)*
- **Scan check:** the verdict's `saferOption`, when it names a pack place.

**What she sees.** Tapping it opens Home with that place highlighted:
- A yellow (`HomewardColors.Yellow`) ring around the place blinks on and off (about once a second) for 8 seconds,
  then stays as a steady yellow ring until she taps the map or opens another screen.
- On the illustrated Lapa map, the ring is drawn at the place's own coordinates, projected with
  `LapaMapProjection.toSpot(lat, lng)`, so it works for any pack place, including the OpenStreetMap ones that
  `PlacesEnricher` swaps in, not only the drawn Police and Hospital badges. If the place falls outside the drawn
  area, Home shows the street map instead. *(Builder's call.)* On the street map
  (`SafetyMapView`), it is a yellow circle overlay on the place's marker, and the map centres between her and it.
- The bottom sheet's nearest-place card shows the same place, so the sheet and the map agree.
- With reduced motion turned on in Android settings, no blinking: a steady yellow ring.

**How it's passed.** The route `home?place=<name>`. Home reads it, finds the `SafePlace`, and passes it to the map
as `highlight` (the street map already has a `highlight` parameter; the Lapa map gets one).

## 7. Files (Android)

New, in `features/scancheck/` (one job per file, README listing them):

| File | Job |
|---|---|
| `ScamWarning.kt` | The data classes above (`ScamWarning`, `FairRate`, `FairPrice`, `ScamKind`, `ScamLevel`) |
| `ScamResearchPrompt.kt` | The cloud prompt for section 4 |
| `ScamResearcher.kt` | Runs it after a pack build, merges `scams` into the saved pack, never throws |
| `ScanReader.kt` | On-device read of the photo (section 5, step 1) with defensive parsing |
| `ScanReading.kt` | What the reader returns, plus the manual-entry version |
| `ScanJudge.kt` | PURE LOGIC: the verdict (section 5, step 2), tested in `ScanJudgeTest` |
| `ScanScreen.kt` | Camera → reading → verdict card, manual fallback |
| `ScanVerdictCard.kt` | The card in section 5 |
| `RecommendedPlace.kt` | PURE LOGIC: the place Beacon recommends for a question (section 6), tested in `RecommendedPlaceTest` |

New, elsewhere: `design/components/BlinkingRing.kt` (the yellow ring, respects reduced motion),
`features/safetypack/DemoBucharestPack.kt`.

Changed (the three touch points, kept small for merging):
1. `SafetyPack.kt`: add `scams: List<ScamWarning> = emptyList()`.
2. `PackUpdater.kt`: one call to `ScamResearcher` after the pack is saved.
3. Home: a "Scan" quick action in `HomeBottomSheet`, plus the `place` route argument and the `highlight` pass-through
   in `HomeScreen`, `LapaIllustratedMap` and `AppNavGraph`/`Screen`.

Also: "Show on map" link in `AskBeaconScreen`; a `FileProvider` entry in `AndroidManifest.xml`; `README.md` files
of the touched folders and `ARCHITECTURE.md` updated in the same commits.

## 8. Hybrid inference rows to add to the build prompt's section 10 table

| Job | Mode | Why |
|---|---|---|
| Research travel scams and fair prices for the pack | Cloud only, with Google Search | Needs the web (Reddit threads, forums, advisories) |
| Read a photo of a board, meter, ticket or sign | `PREFER_ON_DEVICE` | Works offline; the photo stays on the phone when Nano is there |
| Decide Looks fair / Be careful / Walk away | No AI | Numbers compared by code against the saved pack |

## 9. Testing and what can't be checked here

- Unit tests: `ScanJudgeTest`, `RecommendedPlaceTest`, plus a pack load test that an old saved pack without
  `scams` still loads.
- Build with `./gradlew assembleDebug testDebugUnitTest` and try it on the emulator (`Homeward_Pixel` on David's
  Mac, `Pixel_9` in the build prompt). The emulator has no Gemini Nano, so the read runs in the cloud (after the
  question above) and the card shows "Cloud"; that is expected.
- On-device image reading has never been tested on a real phone in this project. If Nano can't read small numbers
  on a board reliably, the manual entry (type the number) is the fallback, and it should be easy to reach.

## 10. Left to the builder

- Exact wording of the prompts, within the rules above.
- Thresholds (3%, 8% default, 1.5×) can be tuned after trying real photos; keep them in `ScanJudge` constants.
- Whether the demo Bucharest pack is chosen by a debug menu or by the pack's city; either is fine.
