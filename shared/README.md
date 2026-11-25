# shared/

What Android, iOS and web have in common. They share data and behaviour, not UI code.

- `schema/`: the shape of the safety pack and of the Firestore documents. Start with `schema/README.md`.
- `fixtures/`: `rio-lapa-pack.json` (the demo pack for Lapa, Rio; exported from Android's `DemoRioPack`, and a test fails if the two differ) and `demo-incident.json` (a made-up incident on the walk in `docs/demo/`, used by the web `/demo` page and by tests).
- `test-vectors/`: input and expected output for the pure logic (zones, place picker, messages, state machine and more). Every platform's unit tests run these and must get the same answers. See `test-vectors/README.md`.
- `prompts/`: the text of the AI prompts with `{placeholders}`, so the three apps ask the same thing.
