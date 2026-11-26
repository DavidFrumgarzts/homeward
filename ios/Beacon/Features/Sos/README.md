# Features/Sos/
- `SosFlow.swift`: compose screen first, active screen after Send; hosts the Messages sheet.
- `SosComposeScreen.swift`: say what's happening (type, dictate, quick picks), check the text and its badge, Send.
- `SosActiveScreen.swift`: what happened to the text and the live link, the text, what to do now, a phrase to show someone, last update, end the SOS.
- `ForMeCard.swift`: the red call button, the nearest open place to get help, then the reviewed steps (Figma "09" order).
- `SosMessageWriter.swift`: `SosPrompt` + the hybrid AI rewrite of her words into one sentence (plain sentence as fallback).
- `MessageComposer.swift`: the iPhone's Messages sheet, filled in. She presses send: an iPhone app cannot send a text by itself.

Debug builds are in test mode (`App/TestMode.swift`): Messages is not opened and nothing is dialed; the screen shows the text (and "would call 190") instead. On the simulator the line says Messages is not available there; on a phone it says "Test mode: no real texts." Launch with `-realTexts YES` on a phone to turn it off.
