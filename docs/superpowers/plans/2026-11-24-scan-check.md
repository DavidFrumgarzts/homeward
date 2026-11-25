# Scan check and yellow blink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Scan" action that reads a photo of a board, meter or price offline and says Looks fair / Be careful / Walk away from scam knowledge saved in the pack, plus a yellow blinking ring on the map for the place Beacon recommends.

**Architecture:** Scam warnings and fair rates/prices are a new `scams` list in `SafetyPack`, researched in the cloud after a pack build. Offline, `AiModels.hybrid` only reads the photo into a `ScanReading`, she confirms the numbers, and pure `ScanJudge` decides. `RecommendedPlace` picks the place in code; Home highlights it with `BlinkingRing`.

**Tech Stack:** Kotlin, Jetpack Compose, kotlinx.serialization, Firebase AI Logic (hybrid + cloud with Google Search), osmdroid, JUnit 4.

**Spec:** `docs/specs/2026-11-24-scan-check-addendum.md` (an add-on to `docs/specs/2026-11-24-beacon-build-prompt.md` on branch `beacon/build-prompt`).

## Global Constraints

- One job per file, under ~150 lines; every touched folder's `README.md` and `ARCHITECTURE.md` updated in the same commit.
- Pure logic has no Android or AI imports and a test in `app/src/test/java/app/homeward/`.
- AI models only in `ai/AiModels.kt`; screens get shared objects from `AppServices`.
- Every AI call has a non-AI fallback; numbers come from the pack or from her confirmation, never trusted from model output.
- Scam text describes practices and places, never people or groups.
- Copy: verdicts are exactly "Looks fair", "Be careful", "Walk away"; never "Safe". Unknown: "Nothing saved about this".
- Colours: Looks fair `HomewardColors.Green`, Be careful `HomewardColors.Yellow`, Walk away `HomewardColors.Amber`; red only for SOS, police call, red zones. Blink ring `HomewardColors.Yellow`.
- Thresholds: money loss < 3% fair; ≤ `walkAwayLossPercent` (default 8) careful; above walk away. Prices: within low..high fair; ≤ 1.5 × high careful; above walk away.
- Blink: on/off about once a second for 8 seconds, then a steady ring; steady only if animations are off.
- Never commit `google-services.json`, `local.properties` or keys. Branch `beacon/scan-check`; no push without David's OK.
- Build/test env: `export JAVA_HOME=/opt/homebrew/opt/openjdk@17 ANDROID_HOME=/opt/homebrew/share/android-commandlinetools`.

## Review Focus

- Board numbers written with a comma ("4,20") or with the currency in lower case ("eur") → read as 4.20 EUR. (Task 4 test)
- A board that shows only a sell rate, or a currency the pack has no fair rate for → no crash, falls to the text/sign match. (Task 2 test)
- A pack saved before this change (no `scams` key) → still loads. (Task 1 test)
- Asking "what's the police number?" → no "Show on map" link; "where can I go?" → link to the nearest open place. (Task 3 test)
- The researcher's answer has no JSON or broken items → pack kept, scams empty, no crash. (Task 5 test)

---

### Task 1: Scam data in the pack, and demo data

**Files:**
- Create: `app/src/main/java/app/homeward/features/scancheck/ScamWarning.kt`, `features/scancheck/README.md`, `features/safetypack/DemoBucharestPack.kt`
- Modify: `features/safetypack/SafetyPack.kt` (add field), `features/safetypack/DemoRioPack.kt` (add `scams`), `features/safetypack/README.md`
- Test: `app/src/test/java/app/homeward/ScamPackTest.kt`

**Interfaces:**
- Produces: `ScamWarning`, `FairRate(from, to, rate: Double, walkAwayLossPercent: Int = 8)`, `FairPrice(item, currency, low: Double, high: Double)`, `enum ScamKind { Money, Taxi, Tour, Shop, Ticket, Other }`, `enum ScamLevel { Careful, Avoid }` exactly as in spec §4; `SafetyPack.scams: List<ScamWarning> = emptyList()`; `DemoBucharestPack.pack: SafetyPack`.

- [ ] **Step 1: Failing tests** — `oldPackWithoutScamsStillLoads` (decode a JSON string of a pack with no `scams` key using `Json { ignoreUnknownKeys = true }`; assert `scams.isEmpty()`), `rioDemoHasScams` (`DemoRioPack.pack.scams.size in 4..6`, every item has a non-empty `sources`), `bucharestDemoHasAFairEuroRate` (a Money warning with `FairRate("EUR","RON", 4.97, 8)`).
- [ ] **Step 2: Run** `./gradlew testDebugUnitTest --tests '*ScamPackTest*'` → FAIL (unresolved references).
- [ ] **Step 3: Implement.** Rio items: airport taxi (Taxi, Careful, fair price GIG→Lapa BRL 90..130), beach card machine (Shop, Avoid), street money changer (Money, Avoid, fair USD→BRL 5.40), "free" bracelet (Other, Careful). Bucharest: city "Bucharest", country "Romania", police "112", two Money warnings ("0% commission" boards in Old Town; airport arrivals exchange) with `FairRate("EUR","RON",4.97,8)`, `saferOption` = a safe place name in that pack (a bank ATM entry, kind "bank"), one zone, comment saying numbers are approximate. Sources: real advisory/Reddit search URLs as the demo's illustration, marked approximate.
- [ ] **Step 4: Run** the same command → PASS.
- [ ] **Step 5: Commit** "Scan check: scam warnings in the pack, Rio and Bucharest demo data".

### Task 2: ScanJudge (pure logic)

**Files:** Create `features/scancheck/ScanReading.kt`, `features/scancheck/ScanJudge.kt`; Test `ScanJudgeTest.kt`.

**Interfaces:**
- Produces: `data class BoardRate(val from: String, val to: String, val buy: Double? = null, val sell: Double? = null)`, `data class SeenPrice(val item: String, val currency: String, val amount: Double)`, `data class ScanReading(val kind: ScamKind, val text: String = "", val rates: List<BoardRate> = emptyList(), val prices: List<SeenPrice> = emptyList())`; `enum class Verdict { LooksFair, BeCareful, WalkAway, Unknown }` with `label` ("Looks fair", "Be careful", "Walk away", "Nothing saved about this"); `data class ScanVerdict(val verdict: Verdict, val why: String, val whatToDo: String, val saferOption: String, val warning: ScamWarning?)`; `object ScanJudge { fun judge(reading: ScanReading, pack: SafetyPack): ScanVerdict }`.

- [ ] **Step 1: Failing tests** using `DemoBucharestPack.pack` and a test pack with `FairPrice("camel ride","EGP",300.0,500.0)`:
  - `buy420IsWalkAway`: `BoardRate("EUR","RON",buy=4.20)` → `WalkAway`; `why` contains "4.20", "4.97", "15%", "420", "497".
  - `buy470IsBeCareful` → `BeCareful`; `buy490IsLooksFair` → `LooksFair`.
  - `lowerCaseCurrencyMatches`: `BoardRate("eur","ron",buy=4.20)` → `WalkAway`.
  - `onlySellRateOrUnknownPairFallsBackToSigns`: `BoardRate("USD","RON",sell=4.6)` with text "0% commission" → verdict from the matching warning's level (`Avoid` → `WalkAway`), no exception.
  - `camel400Fair_700Careful_1500WalkAway`.
  - `noNumbersNoMatchIsUnknown`: `ScanReading(ScamKind.Other, "museum opening hours")` → `Unknown`, `why` == "Nothing saved about this", never `LooksFair`.
  - `emptyPackIsUnknown`.
- [ ] **Step 2: Run** `--tests '*ScanJudgeTest*'` → FAIL.
- [ ] **Step 3: Implement.** Money: loss = (fair − buy) / fair, rounded to whole percent; text "They buy 1 EUR for 4.20 RON. A fair rate is about 4.97. You'd lose about 15% (100 EUR → 420 RON, not 497)." Sign match: lower-cased words of `reading.text` against each warning's `title` + `signs` with the same `kind`; most shared words (≥ 2, or ≥ 1 when the phrase is quoted in `signs`) wins. `whatToDo`/`saferOption` from the matched warning, else a general tip per kind.
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** "Scan check: ScanJudge decides from saved fair rates and prices".

### Task 3: RecommendedPlace (pure logic) and the Ask Beacon prompt line

**Files:** Create `features/scancheck/RecommendedPlace.kt`; Modify `features/ask/AskBeaconPrompt.kt` (one rule line); Test `RecommendedPlaceTest.kt`, extend `AskBeaconPromptTest.kt`.

**Interfaces:**
- Consumes: `SafePlacePicker.pick(here, places, hour): Pick?`, `SafePlacePicker.isOpen`.
- Produces: `object RecommendedPlace { fun pick(question: String, pack: SafetyPack, here: GeoPoint?, hour: Int): SafePlace? ; fun byName(name: String, pack: SafetyPack): SafePlace? }` (`byName`: case- and accent-insensitive equality, used for scan `saferOption` and the Home route).

- [ ] **Step 1: Failing tests** with `DemoRioPack.pack`, here `(-22.9095, -43.1842)`, hour 1: `policeNumberQuestionHasNoPick` (null); `whereCanIGoPicksNearestOpenPlace` (equals `SafePlacePicker.pick(...)!!.place`); `noLocationPicksFirstOpenPlace`; `byNameIgnoresAccentsAndCase` ("hospital souza aguiar"); prompt test: `promptTellsModelToRecommendThePickFirst` (prompt contains "Recommend ${pick.name} first").
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** keywords from spec §6: "safe", "where", "go", "help", "hostel", "police station", "hospital", "walk"; "number"/"call" alone don't count. `AskBeaconPrompt.build` adds the line "Recommend <name> first." when `pick` is non-null.
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** "Recommended place picked in code; Ask Beacon told to name it first".

### Task 4: Reading the photo

**Files:** Create `features/scancheck/ScanReadingParser.kt` (pure), `features/scancheck/ScanReader.kt`; Test `ScanReadingParserTest.kt`.

**Interfaces:**
- Produces: `object ScanReadingParser { fun parse(modelText: String): ScanReading? }`; `object ScanReader { val PROMPT: String; suspend fun read(photo: Bitmap): ScanRead }` with `data class ScanRead(val reading: ScanReading?, val ranOnDevice: Boolean)`.

- [ ] **Step 1: Failing tests:** JSON from spec §5 parses; fenced ```json``` with a sentence around it parses; `"buy": "4,20"` and `"from": "eur"` → 4.20 / "EUR"; unknown kind → `Other`; no JSON → null; missing rates → empty list.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** with `Json { ignoreUnknownKeys = true; isLenient = true }` over `JsonObject`, reusing the `{…}` extraction idea from `SafetyPackBuilder.extractJson`. `ScanReader.read` calls `AiModels.hybrid.askAboutImage(photo, PROMPT)` inside `runCatching`; failure → `ScanRead(null, false)`. Prompt: read only, return the JSON shape in spec §5, no advice.
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** "Scan check: on-device photo reading with a defensive parser".

### Task 5: Online scam research

**Files:** Create `features/scancheck/ScamResearchPrompt.kt`, `features/scancheck/ScamResearcher.kt`, `features/scancheck/ScamResearchSchedule.kt` (pure); Modify `features/safetypack/PackUpdater.kt` (one call at the end); Test `ScamResearchTest.kt`.

**Interfaces:**
- Produces: `ScamResearchPrompt.forCity(city: String, country: String, today: String): String`; `ScamResearchSchedule.shouldTry(pack: SafetyPack, lastTryMillis: Long, nowMillis: Long, online: Boolean): Boolean` (online && scams empty && now − lastTry ≥ 24 h); `ScamResearcher.parse(modelText: String): List<ScamWarning>` (never throws; drops items with no sources); `suspend fun ScamResearcher.researchIfNeeded(context: Context)` (reads/writes last try in `SharedPreferences("scam_research")`, merges into `packStore.save(pack.copy(scams = …))`).

- [ ] **Step 1: Failing tests:** prompt mentions "Reddit", the city, "sources", and "never describe people"; `shouldTry` true/false cases (offline, scams present, tried 2 h ago, tried 25 h ago); `parse` on broken text → empty; item without sources dropped; valid item kept.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**; `PackUpdater.updateIfNeeded` ends with `ScamResearcher.researchIfNeeded(context)` wrapped in `runCatching`, also reached when a pack already exists (move the call before the early returns that follow the OSM step).
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** "Scan check: research reported scams online and save them in the pack".

### Task 6: Scan screen and Home action

**Files:** Create `features/scancheck/ScanScreen.kt`, `features/scancheck/ScanVerdictCard.kt`, `res/xml/file_paths.xml`; Modify `AndroidManifest.xml` (FileProvider `${applicationId}.files`), `navigation/Screen.kt` (`Scan("scan")`), `navigation/AppNavGraph.kt`, `features/home/HomeBottomSheet.kt` (quick action "Scan"), `features/home/HomeScreen.kt` (`onScan` param).

**Interfaces:**
- Consumes: `ScanReader.read`, `ScanJudge.judge`, `RecommendedPlace.byName`, `OnDeviceModelSetup` status, `AppServices.packStore`.
- Produces: `@Composable fun ScanScreen(onBack: () -> Unit, onShowPlace: (String) -> Unit)`.

- [ ] **Step 1:** Implement the flow of spec §5: `TakePicture` into a cache file → if on-device not ready ask "No on-device AI on this phone. Read this photo in the cloud?" ("Read in the cloud" / "Type it instead"); offline without Nano → straight to typing → "We read: …" with editable numbers and kind chips → "Check it" → `ScanVerdictCard` (thumbnail, coloured dot + label, On device/Cloud, why, What to do, blue "Show <place> on the map" when `byName` finds the safer option, "From your <city> pack, saved <date> · N traveler reports", Sources expandable). Manual path: kind chips + one number field.
- [ ] **Step 2: Build** `./gradlew assembleDebug` → BUILD SUCCESSFUL.
- [ ] **Step 3: Emulator check:** install, Home → Scan → take the emulator's camera photo → "Type it instead", Money, 4.20 → Walk away card. Save a screenshot to `docs/walkthrough/img/13-scan-verdict.jpg`.
- [ ] **Step 4: Commit** "Scan check: camera, confirm what was read, verdict card".

### Task 7: Yellow blink on the map

**Files:** Create `design/components/BlinkingRing.kt`; Modify `features/home/HomeScreen.kt` (`highlightName: String?` param), `features/lapamap/LapaIllustratedMap.kt` (`highlight: LapaMapProjection.Spot? = null`), `features/safetymap/SafetyMapView.kt` (yellow circle overlay for `highlight`), `navigation/AppNavGraph.kt` (`home?place={place}`), `features/ask/AskBeaconScreen.kt` ("Show on map" under an answer when `RecommendedPlace.pick` is non-null for its question).

**Interfaces:**
- Produces: `@Composable fun BlinkingRing(modifier: Modifier, color: Color = HomewardColors.Yellow, blinkMillis: Long = 8_000)`; `AskBeaconScreen(firstQuestion, onBack, onShowPlace: (String) -> Unit)`.

- [ ] **Step 1:** Implement per spec §6: Home resolves the name with `RecommendedPlace.byName`; inside Lapa and `toSpot` non-null → ring on the drawn map at that spot; else street map centred between her and the place with the yellow overlay; the bottom sheet's place card shows the same place. Steady ring when `Settings.Global.ANIMATOR_DURATION_SCALE` is 0.
- [ ] **Step 2: Build** → BUILD SUCCESSFUL; run all unit tests `./gradlew testDebugUnitTest` → all pass.
- [ ] **Step 3: Emulator check:** Ask Beacon "Where's a safe place?" → "Show on map" → Home with the yellow blinking ring; screenshot `docs/walkthrough/img/14-show-on-map.jpg`.
- [ ] **Step 4:** Update `ARCHITECTURE.md` (hybrid rows from spec §8, scancheck folder, bug table lines), `features/README.md`, touched folder READMEs. **Commit** "Show on map: the recommended place blinks yellow".
