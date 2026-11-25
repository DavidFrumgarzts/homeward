# AI/
Every AI call goes through here.
- `AiModels.swift`: the models. `askHybrid` = Apple's on-device model first (works offline), Gemini in the cloud as fallback. `askCloudResearch` = cloud with Google Search. `onDevice` says whether this iPhone can answer by itself.
- `AiAnswer.swift`: what a call returns (the text, and whether it ran on the device), plus the timeout helper.

Each caller has a non-AI fallback, so nothing breaks when AI is unavailable.
On-device inference only runs while the app is in the foreground. The simulator cannot run Apple's model at all (it reports "available" but refuses every request), so there the answer comes from the cloud, or from the saved rules when App Check has no registered token.
