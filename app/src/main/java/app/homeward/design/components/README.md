# design/components/
One UI piece per file.
- `PrimaryButton.kt`: the one main action on a screen. Blue; red only for SOS and the police call.
- `HoldButton.kt`: fires only after a 1.5 s hold, with a growing fill (Hold for SOS). Double tap with TalkBack.
- `WhiteCard.kt`: the flat white rounded card. `IconCircle.kt`: an icon on a soft colored tile.
- `ProgressDots.kt`: the segmented bar at the top of onboarding.
- `InferenceBadge.kt`: "On device" / "Cloud" / "No AI" tag on AI-written text.
- `BlinkingRing.kt`: the yellow "go here" ring for a recommended place; its timing `Blink` is tested in `BlinkTest`.
