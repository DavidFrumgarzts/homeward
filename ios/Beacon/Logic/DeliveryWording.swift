import Foundation

// PURE LOGIC: the honest words on the "SOS sent" screen. "Mom knows" (and the green tick) is only
// ever said for a message reported as delivered. Everything else says exactly where the message is:
// on the phone, sent and waiting, or failed.
// Same as Android's DeliveryWording.kt; tested in shared/test-vectors/delivery-wording.json.
// (An iPhone never learns that a text was delivered, so the iOS screen can reach "Sent to" at most.)
enum DeliveryWording {
    struct Summary: Equatable, Sendable {
        var headline: String
        var lines: [String]
        var anyDelivered: Bool
    }

    static func summarize(_ deliveries: [ContactDelivery]) -> Summary {
        func names(_ statuses: DeliveryStatus...) -> [String] { deliveries.filter { statuses.contains($0.status) }.map(\.contactName) }
        let delivered = names(.delivered)
        let sent = names(.sent)
        let waiting = names(.savedOnPhone, .waitingForSignal)
        let failed = names(.failed)

        let headline: String
        if deliveries.isEmpty { headline = "No one to send to yet" }
        else if !delivered.isEmpty { headline = "\(Names.join(delivered)) \(delivered.count == 1 ? "knows" : "know")" }
        else if !sent.isEmpty { headline = "Sent to \(Names.join(sent))" }
        else if !waiting.isEmpty { headline = "Saved on your phone" }
        else { headline = "SOS not sent" }

        var lines: [String] = []
        if deliveries.isEmpty { lines.append("Add a trusted contact, and call the police if you are in danger.") }
        if !sent.isEmpty { lines.append(delivered.isEmpty ? "Waiting for delivery." : "Sent to \(Names.join(sent)), waiting for delivery.") }
        if !waiting.isEmpty {
            lines.append(delivered.isEmpty && sent.isEmpty ? "It sends when you have signal." : "Saved on your phone for \(Names.join(waiting)). It sends when you have signal.")
        }
        if !failed.isEmpty { lines.append("Couldn't send to \(Names.join(failed)). Call them, or call the police.") }
        return Summary(headline: headline, lines: lines, anyDelivered: !delivered.isEmpty)
    }
}
