# Features/Ask/
"Ask Beacon": a chat answered from the saved pack.
- `AskBeacon.swift`: asks the hybrid model (on the iPhone when it can, cloud otherwise); when no AI can answer, `Logic/AskBeaconRules.swift` does.
- `AskBeaconScreen.swift`: the chat: the cop, the bubbles, the badge under each answer, the box to type in.
- `BeaconCop.swift`: the cop picture, bobbing.

Rule: numbers, names and places are copied from the saved pack. The AI is told never to invent them.
