# features/sos/
DISPLAY for an SOS. These screens only draw `IncidentViewState` and call the incident engine's intents; all decisions are in `features/incident/`.
- `SosComposeScreen.kt`: say what's happening (type, mic, five quick picks), see and edit the message, Send. Back cancels.
- `ContactMessageCard.kt`: the editable message with the "On device" / "Cloud" / "No AI" badge.
- `SosSentScreen.kt`: after Send and while the SOS is active: who really has the message, the message, what to do, a phrase to show, location status, "I'm safe now, end SOS".
- `SosStatusHeader.kt`: the ring, headline and delivery lines. Green tick only for delivered messages. Also the "Test mode" tag.
- `ForMeCard.kt`: the call button, the nearest open place, then the reviewed steps (Figma 9 order).
- `LocalPhrasesCard.kt`: "Show someone nearby", a reviewed phrase from the pack, shown large.
- `DeliveryWording.kt`: PURE LOGIC. The honest words for saved / sent / delivered / failed. `SessionWording.kt`: PURE LOGIC. The location status line.
- `SosMessageWriter.kt`: hybrid AI rewrites her words into one sentence (plain template if it fails). `SosPrompt.kt`: the instructions.
- `sending/`: `SmsGateway` (interface; `SmsSender` is the real one), `SmsStatusReceiver` (sent and delivered reports from the radio), `SosOutbox` (messages wait here, saved to a file), `OutboxFlusher` (sends what is waiting when there is signal), `SosDispatcher` (queues a message for every contact), `ChannelChooser`, `SendChannel`, `PushSender` (stub; needs a server).
