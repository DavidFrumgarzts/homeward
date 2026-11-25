package app.homeward.features.incident

// The "For me" checklist: a fixed, reviewed list of steps for each situation. Nothing here is written
// by AI, and no step contains a phone number or a place name: those come from the saved pack and are
// shown next to the list. Change wording here only after someone has reviewed it.
// The same text is in shared/test-vectors/situation.json, so iOS and web show identical steps.
object ActionChecklist {
    private val steps = mapOf(
        Situation.Followed to listOf(
            "Go where there are people and light: a shop, a bar, a hotel lobby.",
            "Don't walk to where you are staying while someone is following you.",
            "Stay on the phone with someone, or look like you are.",
            "If they come close, call the number below and say where you are.",
        ),
        Situation.Lost to listOf(
            "Stop somewhere lit, near other people. Don't keep walking into quiet streets.",
            "Walk to the nearest open place to get help, shown below.",
            "Ask staff in a shop or hotel for directions, not someone passing by.",
            "Save your battery: lower the screen brightness.",
        ),
        Situation.Vehicle to listOf(
            "Tell the driver clearly to stop and let you out somewhere busy and lit.",
            "Add the plate or taxi number to your message if you can see it.",
            "Keep your phone in your hand with this screen open.",
            "If the driver won't stop, call the number below and say which road you are on.",
        ),
        Situation.Medical to listOf(
            "Call the number below. Say where you are and what happened.",
            "If you are bleeding, press hard on the wound with a clean cloth.",
            "Sit or lie down where people can see you.",
            "Show the phrase below to someone nearby and ask them to stay with you.",
        ),
        Situation.Harassment to listOf(
            "Move toward other people, staff or a shop.",
            "Don't argue or explain. Keep walking to somewhere busy and lit.",
            "Ask staff or a group nearby to stay with you.",
            "If they follow or touch you, call the number below.",
        ),
        Situation.Other to listOf(
            "Go where there are people and light.",
            "If you are in danger right now, call the number below.",
            "Walk to the nearest open place to get help, shown below.",
        ),
    )

    fun stepsFor(situation: Situation): List<String> = steps.getValue(situation)
}
