# ask

"Ask Beacon": a chat that answers with no signal, from what the cloud saved on wifi.

- `AskBeaconPrompt.kt`: PURE LOGIC. Builds the text sent to the AI: the saved facts, the last two exchanges of the chat, and the question. Tested in `AskBeaconPromptTest`.
- `AskBeacon.kt`: asks the hybrid AI (on the phone when it can, cloud otherwise). If the AI fails, returns the saved emergency numbers instead.
- `AskBeaconScreen.kt`: the chat screen: the cop, the bubbles, the box to type in. Tap the cop to hear the last answer.
- `BeaconCop.kt`: the animated cop (bobs, blinks, looks up while thinking, moves its mouth while talking).

The voice is the phone's own (`device/Speaker.kt`), so it works offline.
Rule: numbers, names and addresses are copied from the saved pack. The AI is told never to invent them.
