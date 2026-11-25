import Foundation

// The "For me" checklist: a fixed, reviewed list of steps for each situation. Nothing here is written
// by AI, and no step contains a phone number or a place name: those come from the saved pack and are
// shown next to the list. The text must stay identical to Android's ActionChecklist.kt; the shared
// vectors in shared/test-vectors/situation.json check that.
enum ActionChecklist {
    static func steps(for situation: Situation) -> [String] {
        switch situation {
        case .followed: return [
            "Go where there are people and light: a shop, a bar, a hotel lobby.",
            "Don't walk to where you are staying while someone is following you.",
            "Stay on the phone with someone, or look like you are.",
            "If they come close, call the number below and say where you are.",
        ]
        case .lost: return [
            "Stop somewhere lit, near other people. Don't keep walking into quiet streets.",
            "Walk to the nearest open place to get help, shown below.",
            "Ask staff in a shop or hotel for directions, not someone passing by.",
            "Save your battery: lower the screen brightness.",
        ]
        case .vehicle: return [
            "Tell the driver clearly to stop and let you out somewhere busy and lit.",
            "Add the plate or taxi number to your message if you can see it.",
            "Keep your phone in your hand with this screen open.",
            "If the driver won't stop, call the number below and say which road you are on.",
        ]
        case .medical: return [
            "Call the number below. Say where you are and what happened.",
            "If you are bleeding, press hard on the wound with a clean cloth.",
            "Sit or lie down where people can see you.",
            "Show the phrase below to someone nearby and ask them to stay with you.",
        ]
        case .harassment: return [
            "Move toward other people, staff or a shop.",
            "Don't argue or explain. Keep walking to somewhere busy and lit.",
            "Ask staff or a group nearby to stay with you.",
            "If they follow or touch you, call the number below.",
        ]
        case .other: return [
            "Go where there are people and light.",
            "If you are in danger right now, call the number below.",
            "Walk to the nearest open place to get help, shown below.",
        ]
        }
    }
}
