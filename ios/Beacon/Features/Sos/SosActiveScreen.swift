import SwiftUI

// After Send, and for as long as the SOS is on (Figma "09 SOS sent", with honest wording):
// what happened to the text and the live link, the text itself, what to do now ("For me"),
// a phrase to show someone nearby, when the last location update went out, and a quiet way to end it.
struct SosActiveScreen: View {
    @EnvironmentObject private var incident: IncidentEngine
    @EnvironmentObject private var store: LocalStore
    @EnvironmentObject private var sync: IncidentSync
    @State private var confirmEnd = false

    var body: some View {
        let view = incident.view
        let ended = view.phase == .resolved
        let summary = SosPathWording.summarize(names: store.contacts.map(\.name), messages: incident.messages, link: sync.link)
        ScrollView {
            VStack(spacing: 18) {
                StatusMark(sent: summary.sent, ended: ended).padding(.top, 8)
                Text(ended ? "SOS ended" : summary.headline).style(.title).multilineTextAlignment(.center)
                VStack(spacing: 4) {
                    ForEach(ended ? ["Location sharing has stopped."] : summary.lines, id: \.self) {
                        Text($0).style(.small).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                    }
                }
                if !ended && incident.messages == .cancelled { PrimaryButton(label: "Open Messages again") { incident.reopenMessages() } }

                if ended {
                    // The "it's over" text for her contacts. On an iPhone she sends it herself, from Messages.
                    if let text = incident.endedText, view.alertSent {
                        WhiteCard {
                            Text(view.testMode ? "Test mode: Messages is not available in the simulator. On a real iPhone this text opens ready to send:" : "Tell your contacts. This text is ready in Messages:").style(.small)
                            Text(text).style(.small, color: BeaconColors.text).padding(.top, 6).textSelection(.enabled)
                        }
                        if !view.testMode {
                            Button("Open Messages again") { incident.reopenMessages() }.font(TextLook.label.font).foregroundStyle(BeaconColors.primary).frame(minHeight: 48)
                        }
                    }
                    PrimaryButton(label: "Back to the map") { incident.reset() }
                } else {
                    if !view.contactMessage.isEmpty {
                        WhiteCard { Text(view.contactMessage).style(.small, color: BeaconColors.text).textSelection(.enabled) }
                    }
                    ForMeCard(view: view) { incident.callEmergency() }
                    if let phrase = view.showNearby {
                        WhiteCard {
                            Text("Show someone nearby").style(.label)
                            Text(phrase.local).font(BeaconFonts.sora(26, weight: 700)).foregroundStyle(BeaconColors.text).padding(.top, 8)
                            Text(phrase.english).style(.small)
                        }
                    }
                    Text(locationLine(view)).style(.small).multilineTextAlignment(.center)
                    Button("I'm safe now, end SOS") { confirmEnd = true }
                        .font(TextLook.label.font).foregroundStyle(BeaconColors.textMuted).frame(minHeight: 48)
                }
            }
            .padding(.horizontal, 20).padding(.vertical, 16)
        }
        .confirmationDialog("End the SOS?", isPresented: $confirmEnd, titleVisibility: .visible) {
            Button("Yes, I'm safe now") { incident.imOk() }
            Button("Keep the SOS on", role: .cancel) {}
        } message: {
            Text("Location sharing stops, and Beacon opens Messages so you can tell your contacts it is over.")
        }
    }

    // When the last location update really left the phone, how old the newest fix is, or that there is none.
    private func locationLine(_ view: IncidentViewState) -> String {
        var parts: [String] = []
        if let sent = view.lastUpdateSentAtMillis { parts.append("Last location update sent \(Clock.timeText(sent)).") }
        if view.pointsWaiting > 0 { parts.append("\(view.pointsWaiting) location \(view.pointsWaiting == 1 ? "point" : "points") saved on your phone, waiting for signal.") }
        if let fix = view.lastFix { parts.append("Your position was read \(Clock.ageText(fix.takenAtMillis)).") } else { parts.append("No GPS fix yet.") }
        return parts.joined(separator: " ")
    }
}

// The round mark at the top: a blue tick once she pressed send in Messages (never green: an iPhone
// cannot confirm delivery), a clock while nothing has gone out, grey once the SOS has ended.
private struct StatusMark: View {
    var sent: Bool
    var ended: Bool

    var body: some View {
        let tint = ended ? BeaconColors.textMuted : sent ? BeaconColors.primary : BeaconColors.amber
        ZStack {
            Circle().stroke(tint.opacity(0.18), lineWidth: 3).frame(width: 132, height: 132)
            Circle().fill(tint.opacity(0.12)).frame(width: 92, height: 92)
            Image(systemName: ended ? "checkmark" : sent ? "paperplane.fill" : "clock").font(.system(size: 40, weight: .semibold)).foregroundStyle(tint)
        }
        .accessibilityHidden(true)
    }
}
