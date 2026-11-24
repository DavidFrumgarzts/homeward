# features/sos/
- `SosComposeScreen.kt`: type or tap what's happening, check the AI draft, send.
- `SosSentScreen.kt`: who got it and how, police call, nearest safe place.
- `SosViewModel.kt`: the flow's state and actions.
- `SosMessageWriter.kt`: on-device AI writes the message (template fallback). `SosPrompt.kt`: the AI instructions.
- `sending/`: `ChannelChooser` (push or SMS), `SmsSender`, `PushSender` (needs a Cloud Function, not built yet), `SosDispatcher` (sends to everyone), `SendChannel` (result types).
