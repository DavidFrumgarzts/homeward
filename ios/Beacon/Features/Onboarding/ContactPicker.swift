import ContactsUI
import SwiftUI

// iOS's own contact picker. No contacts permission is needed: Beacon only gets the one person picked.
// `onPick` receives that person's name and first phone number.
struct ContactPicker: UIViewControllerRepresentable {
    var onPick: @MainActor @Sendable (_ name: String, _ phone: String) -> Void

    func makeUIViewController(context: Context) -> CNContactPickerViewController {
        let picker = CNContactPickerViewController()
        picker.delegate = context.coordinator
        picker.predicateForEnablingContact = NSPredicate(format: "phoneNumbers.@count > 0") // people with no number can't get a text
        return picker
    }

    func updateUIViewController(_ controller: CNContactPickerViewController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(onPick: onPick) }

    final class Coordinator: NSObject, CNContactPickerDelegate {
        let onPick: @MainActor @Sendable (String, String) -> Void
        init(onPick: @escaping @MainActor @Sendable (String, String) -> Void) { self.onPick = onPick }

        func contactPicker(_ picker: CNContactPickerViewController, didSelect contact: CNContact) {
            let name = [contact.givenName, contact.familyName].filter { !$0.isEmpty }.joined(separator: " ")
            let phone = contact.phoneNumbers.first?.value.stringValue ?? ""
            let onPick = self.onPick
            Task { @MainActor in onPick(name.isEmpty ? "Contact" : name, phone) }
        }
    }
}
