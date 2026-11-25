# ios/BeaconTests
Unit tests for the pure logic. They run inside the app on the simulator and read shared files straight from the repo.
- `Vectors.swift`, `Repo.swift`: load `shared/test-vectors/` and other repo files.
- `SharedVectorsTests.swift`, `IncidentMachineVectorsTests.swift`: all nine shared vector files. A new vector file fails `testEveryVectorFileIsRun` until it is run here.
- `SafetyPackTests.swift`: the bundled pack is the shared fixture; unknown and missing fields.
- `SmallLogicTests.swift`: distance, coordinates, clock words, phone numbers, check-in text, projection, heading, profile wording, setup order.
- `AskBeaconTests.swift`: the prompt carries only saved facts; the no-AI rules.
- `SosWordingTests.swift`: the SOS writer always returns a sentence; the "sent" screen never overclaims.
- `IncidentViewTests.swift`: what the SOS screens are given; the saved incident has the shared schema's fields.
- `AssetsInSyncTests.swift`: the map pictures match `docs/design/landmarks/`.
