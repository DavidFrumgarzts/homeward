# features/incident/
PROCESSING: the incident state machine and everything an SOS does. No screens here.

`Inactive -> SafetyCheckRequested -> SosActive -> Resolved`, and `Inactive -> SosActive` for confirmed triggers.

- `contracts/`: the plain data the three layers pass to each other. `IncidentInput` (input -> processing), `IncidentViewState` (processing -> display), `LocationFix`, `ActivationMethod`, `Delivery`.
- `IncidentState.kt`: what the engine remembers, the events that can happen, the effects it can ask for.
- `IncidentReducer.kt`: PURE LOGIC. `(state, event, time) -> state + effects`. Every transition lives here. Tested in `IncidentReducerTest` and `shared/test-vectors/incident-machine.json`.
- `IncidentEngine.kt`: holds the state, exposes `view` (a `StateFlow<IncidentViewState>`) and the intents screens call (`startSos`, `describe`, `editMessage`, `send`, `imOk`, `cancel`, `callEmergency`). Lives for the whole app process.
- `IncidentEffects.kt`: does what the reducer asked: starts the session, asks the AI for the sentence, sends texts.
- `IncidentDeps.kt`: what the engine needs from outside (clock, pack, profile, location, sending). `AndroidIncidentDeps.kt` is the real one; tests use a fake.
- `IncidentViewStateMapper.kt`: PURE LOGIC. State + pack -> the three cards (for me, for my contacts, show someone nearby).
- `Situation.kt`: the six situations and the key-word picker (no AI). `ActionChecklist.kt`: the fixed, reviewed steps for each.
- `PhrasePicker.kt`: PURE LOGIC. Which reviewed phrase from the pack to show a stranger.
- `UpdateThrottle.kt`: PURE LOGIC. When contacts get a location update (200 m or 5 min, at most one per 2 min, one catch-up after no signal).
- `IncidentMessages.kt`: PURE LOGIC. Every text contacts can receive. Numbers, coordinates and links are added here, never by AI.

Rules: only she can end an SOS or stand down a safety check. The automatic alert (no answer to an urgent safety check) uses a fixed template and never says a crime is happening.
