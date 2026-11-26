import Foundation

// Test mode: Beacon behaves normally, but never texts or calls anyone for real. Messages is not
// opened (the screens show the text that would have gone out) and the police / ambulance buttons
// show the number instead of dialing it. Firestore writes still happen (they only reach the team's
// own Firebase project, and only when GoogleService-Info.plist is present).
//
//   Release builds              -> off, always.
//   Debug build, simulator      -> on, always (the simulator can't open Messages or dial anyway).
//   Debug build, real iPhone    -> on by default, so installing a debug build on a personal phone
//                                  can't text family or call 190 by accident. To test the real
//                                  Messages sheet and dialer on purpose, launch with `-realTexts YES`
//                                  (Xcode: Product > Scheme > Edit Scheme > Run > Arguments).
enum TestMode {
    static let isOn: Bool = {
        #if DEBUG
        #if targetEnvironment(simulator)
        return true
        #else
        return !UserDefaults.standard.bool(forKey: "realTexts")
        #endif
        #else
        return false
        #endif
    }()

    static var onSimulator: Bool {
        #if targetEnvironment(simulator)
        true
        #else
        false
        #endif
    }

    // The first sentence of every test-mode note about texts. Never says "simulator" on a real phone.
    static var noTexts: String {
        onSimulator ? "Test mode: Messages is not available in the simulator." : "Test mode: no real texts."
    }

    // Shown instead of dialing a number.
    static func wouldCall(_ number: String) -> String {
        "Test mode: would call \(number). Nothing was dialed."
    }
}
