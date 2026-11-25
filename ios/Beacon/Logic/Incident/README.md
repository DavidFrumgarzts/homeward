# Logic/Incident/
The incident state machine: Inactive -> SafetyCheckRequested -> SosActive -> Resolved. Pure, and identical to Android's.
- `Contracts.swift`: the shared contracts (`IncidentInput` in, `IncidentViewState` out, delivery and phase types).
- `IncidentState.swift`: what is remembered, the events that can happen, the effects that can be asked for.
- `IncidentReducer.swift`: (state, event, time) -> new state + effects. Checked by `shared/test-vectors/incident-machine.json`.
- `IncidentViewStateMapper.swift`: state + pack -> what the SOS screens draw.
