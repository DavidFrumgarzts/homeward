# ask

"Ask Beacon": a chat that answers with no signal, from what the cloud saved on wifi.

- `AskBeaconPrompt.kt`: PURE LOGIC. Builds the text sent to the AI: the saved facts, the last two exchanges of the chat, and the question. Tested in `AskBeaconPromptTest`.
- `AskBeacon.kt`: asks the hybrid AI (on the phone when it can, cloud otherwise). If no model can answer, `AskBeaconRules` answers instead.
- `AskBeaconRules.kt`: PURE LOGIC, no AI. Key-word rules that answer from the saved pack (numbers, nearest open place, the nearest risky street, phrases). Tested in `AskBeaconRulesTest`.
- `AskBeaconScreen.kt`: the chat screen: the cop, the bubbles (each answer with its "On device" / "Cloud" / "No AI" badge), the box to type in. Tap the cop to hear the last answer.
- `BeaconCop.kt`: the animated cop (bobs, blinks, looks up while thinking, moves its mouth while talking).

The voice is the phone's own (`device/Speaker.kt`), so it works offline.
Rule: numbers, names and addresses are copied from the saved pack. The AI is told never to invent them.
