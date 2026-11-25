import MessageUI
import SwiftUI

// Opens the iPhone's own Messages sheet with the people and the text already filled in.
// She presses send: an iPhone app is not allowed to send a text by itself.
// Only shown when the device can send texts (never on the simulator; see IncidentEngine.testMode).
struct MessageComposer: UIViewControllerRepresentable {
    var request: ComposeRequest
    var onFinish: @MainActor @Sendable (ComposeOutcome) -> Void

    func makeUIViewController(context: Context) -> MFMessageComposeViewController {
        let controller = MFMessageComposeViewController()
        controller.recipients = request.recipients
        controller.body = request.body
        controller.messageComposeDelegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ controller: MFMessageComposeViewController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(onFinish: onFinish) }

    final class Coordinator: NSObject, MFMessageComposeViewControllerDelegate {
        let onFinish: @MainActor @Sendable (ComposeOutcome) -> Void
        init(onFinish: @escaping @MainActor @Sendable (ComposeOutcome) -> Void) { self.onFinish = onFinish }

        func messageComposeViewController(_ controller: MFMessageComposeViewController, didFinishWith result: MessageComposeResult) {
            let outcome: ComposeOutcome = result == .sent ? .sent : result == .failed ? .failed : .cancelled
            let onFinish = self.onFinish
            Task { @MainActor in onFinish(outcome) }
        }
    }
}
