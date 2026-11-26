# ai/
Every AI call goes through here.
- `AiModels.kt`: the two models. `hybrid` = on-device first (works offline). `cloudResearch` = cloud + Google Search.
- `AiAnswer.kt`: `ask()` / `askAboutImage()` helpers; each answer says if it ran on the device (or that no AI wrote it), which drives the "On device / Cloud / No AI" badge.
- `OnDeviceModelSetup.kt`: downloads Gemini Nano on first launch.
