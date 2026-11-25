import SwiftUI

// Step 1 of an SOS: say what's happening (type, dictate with the keyboard's mic, or tap a quick
// pick). The text for her contacts is ready from the first moment (a plain version), the AI improves
// it when she pauses, and she can edit it. Send opens Messages with everything filled in.
struct SosComposeScreen: View {
    @EnvironmentObject private var incident: IncidentEngine
    @EnvironmentObject private var store: LocalStore
    @State private var description = ""
    @State private var draft = ""
    @FocusState private var editingDraft: Bool

    private static let quickPicks = ["Being followed", "Feel unsafe", "Hurt", "Lost", "In a vehicle"]

    var body: some View {
        let view = incident.view
        let names = Names.join(store.contacts.map(\.name))
        VStack(alignment: .leading, spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    BackButton(label: "Cancel the SOS") { incident.cancel() }
                    Text("What's happening?").style(.title)
                    TextField("A few words are enough", text: $description, axis: .vertical).lineLimit(2...4)
                        .font(TextLook.body.font).foregroundStyle(BeaconColors.text)
                        .padding(16).background(BeaconColors.surface).clipShape(RoundedRectangle(cornerRadius: BeaconRadius.button, style: .continuous))
                        .onChange(of: description) { if description != incident.view.description { incident.describe(description) } }
                    QuickPickChips(options: Self.quickPicks) { pick in
                        description = description.isBlank ? pick : "\(description.trimmingCharacters(in: .whitespacesAndNewlines)), \(pick.lowercased())"
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(names.isEmpty ? "Your message" : "Message to \(names)").style(.label)
                            Spacer()
                            if view.writingMessage { ProgressView().controlSize(.small) } else { InferenceBadge(ranOnDevice: view.contactMessageRanOnDevice, noAiLabel: "No AI: plain text") }
                        }
                        TextEditor(text: $draft).font(TextLook.body.font).foregroundStyle(BeaconColors.text).scrollContentBackground(.hidden)
                            .frame(minHeight: 190).focused($editingDraft)
                            .onChange(of: draft) { if editingDraft && draft != incident.view.contactMessage { incident.editMessage(draft) } }
                    }
                    .padding(16).background(BeaconColors.surface).clipShape(RoundedRectangle(cornerRadius: BeaconRadius.holdButton, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: BeaconRadius.holdButton, style: .continuous).stroke(BeaconColors.primary, lineWidth: 1.5))

                    if view.lastFix == nil { Text("No GPS fix yet. The text will say so; Beacon adds your location as soon as it has one.").style(.small) }
                }
                .padding(.horizontal, BeaconSpacing.sheet).padding(.top, 8)
            }
            .scrollDismissesKeyboard(.interactively)
            VStack(spacing: 8) {
                PrimaryButton(label: names.isEmpty ? "Add a contact first" : "Send to \(names)", color: BeaconColors.red, enabled: !names.isEmpty && !view.contactMessage.isBlank, height: BeaconSize.holdButton) { incident.send() }
                Text(view.testMode ? "Test mode: Messages is not available in the simulator. No text is sent; the live link is still saved." : "Opens Messages with everything filled in. You press send.").style(.small)
            }
            .padding(.horizontal, BeaconSpacing.sheet).padding(.vertical, 12)
        }
        .onAppear { description = view.description; draft = view.contactMessage }
        // The engine owns the draft: when the plain text or the AI's version arrives, show it (unless she is typing in it).
        .onChange(of: view.contactMessage) { if !editingDraft || draft.isEmpty { draft = view.contactMessage } }
    }
}
