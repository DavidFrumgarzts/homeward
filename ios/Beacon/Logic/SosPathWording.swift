import Foundation

// What happened when Beacon handed the SOS text to Messages. An iPhone app cannot send a text by
// itself and is never told about delivery, so "sent" here means: she pressed send in Messages.
enum MessagesPath: Equatable, Sendable { case notOpened, composing, sent, cancelled, failed, testMode, unavailable }

// What happened to the live link (the incident and its location updates in Firestore).
enum LinkPath: Equatable, Sendable { case upToDate, savedOnPhone, waitingForFirstConnection, failed }

// PURE LOGIC: the honest words on the iOS "SOS sent" screen. The iPhone has two paths (the text she
// sends from Messages, and the live link), and this says plainly which one worked. It never says a
// contact "knows": iOS cannot confirm delivery. Tested in SosPathWordingTests.
enum SosPathWording {
    struct Summary: Equatable, Sendable {
        var headline: String
        var lines: [String]
        var sent: Bool          // true only once she pressed send in Messages
    }

    static func summarize(names: [String], messages: MessagesPath, link: LinkPath) -> Summary {
        let people = Names.join(names)
        var headline: String
        var lines: [String]
        if names.isEmpty {
            headline = "No one to send to yet"
            lines = ["Add a trusted contact, and call the police if you are in danger."]
        } else {
            switch messages {
            case .sent:
                headline = "Sent to \(people)"
                lines = ["Messages has your text. An iPhone can't tell Beacon when it is delivered."]
            case .notOpened, .composing:
                headline = "Press send in Messages"
                lines = ["Beacon filled in \(people) and the text. On an iPhone you press send yourself."]
            case .cancelled:
                headline = "Not sent yet"
                lines = ["Messages was closed before the text was sent. Open it again and press send."]
            case .failed:
                headline = "Messages couldn't send it"
                lines = ["Try again, or call the number below."]
            case .testMode:
                headline = "Test mode: Messages is not available in the simulator"
                lines = ["On a real iPhone, Messages opens here with this text ready for \(people)."]
            case .unavailable:
                headline = "This device can't send texts"
                lines = ["Call the number below. The live link still updates for anyone who has it."]
            }
        }
        switch link {
        case .upToDate: lines.append("Live link is up to date.")
        case .savedOnPhone: lines.append("Saved on your phone. The live link updates when you have signal.")
        case .waitingForFirstConnection: lines.append("Saved on your phone. The live link starts when you have signal.")
        case .failed: lines.append("The live link couldn't update. Your text still has your location.")
        }
        return Summary(headline: headline, lines: lines, sent: messages == .sent && !names.isEmpty)
    }
}
