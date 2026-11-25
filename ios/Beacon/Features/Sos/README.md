# Features/Sos/
- `SosFlow.swift`: compose screen first, active screen after Send; hosts the Messages sheet.
- `SosComposeScreen.swift`: say what's happening (type, dictate, quick picks), check the text and its badge, Send.
- `SosActiveScreen.swift`: what happened to the text and the live link, the text, what to do now, a phrase to show someone, last update, end the SOS.
- `ForMeCard.swift`: the reviewed steps, the call button, the nearest open place to get help.
- `SosMessageWriter.swift`: `SosPrompt` + the hybrid AI rewrite of her words into one sentence (plain sentence as fallback).
- `MessageComposer.swift`: the iPhone's Messages sheet, filled in. She presses send: an iPhone app cannot send a text by itself.

On the simulator Messages cannot open; debug builds show "Test mode: Messages is not available in the simulator" with the text instead.
