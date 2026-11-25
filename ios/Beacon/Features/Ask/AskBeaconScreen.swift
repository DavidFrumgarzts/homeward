import SwiftUI

// One line of the chat. `fromYou` = the traveler's question; otherwise Beacon's answer, with where it was written.
private struct ChatLine: Identifiable, Equatable {
    let id = UUID()
    var fromYou: Bool
    var text: String
    var ranOnDevice: Bool? = nil
}

// Chat with Beacon (Figma "08 Ask Beacon"): the cop at the top, your questions in blue on the right,
// Beacon's answers in white on the left with an "On device" / "Cloud" badge, and a box to type the
// next one. It keeps the last answers in mind for follow-ups.
// `firstQuestion` is what was tapped on Home ("" opens an empty chat).
struct AskBeaconScreen: View {
    var firstQuestion: String

    @EnvironmentObject private var packs: PackStore
    @EnvironmentObject private var location: LocationService
    @Environment(\.dismiss) private var dismiss
    @State private var lines: [ChatLine] = []
    @State private var typed = ""
    @State private var thinking = false

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                HStack {
                    Button { dismiss() } label: { Image(systemName: "arrow.left").font(.system(size: 18, weight: .semibold)).foregroundStyle(BeaconColors.text).frame(width: 44, height: 44, alignment: .leading) }
                        .accessibilityLabel("Back")
                    Spacer()
                }
                BeaconCop(lively: thinking)
            }
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(lines) { Bubble(line: $0).id($0.id) }
                        if thinking { Bubble(line: ChatLine(fromYou: false, text: "…")).id("thinking") }
                        if lines.isEmpty && !thinking {
                            QuickPickChips(options: ["What's the police number?", "Is this area OK now?", "Where can I get help?"]) { ask($0) }.padding(.top, 8)
                        }
                    }
                    .padding(.vertical, 16)
                }
                .scrollIndicators(.hidden)
                .onChange(of: lines) { withAnimation { proxy.scrollTo(lines.last?.id, anchor: .bottom) } }
            }
            Text("From your \(packs.pack.city) pack, saved on this phone.").style(.small).frame(maxWidth: .infinity, alignment: .leading).padding(.bottom, 8)
            HStack {
                TextField(lines.isEmpty ? "Ask Beacon anything" : "Ask a follow-up", text: $typed).font(TextLook.body.font).foregroundStyle(BeaconColors.text)
                    .submitLabel(.send).onSubmit { ask(typed) }
                Button { ask(typed) } label: {
                    Image(systemName: "arrow.up").font(.system(size: 18, weight: .semibold)).foregroundStyle(.white)
                        .frame(width: 48, height: 48).background(BeaconColors.primary).clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .accessibilityLabel("Send")
            }
            .padding(.leading, 18).padding(.trailing, 6).padding(.vertical, 6)
            .background(BeaconColors.surface).clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        }
        .padding(.horizontal, 20).padding(.vertical, 12)
        .background(BeaconColors.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { if !firstQuestion.isBlank && lines.isEmpty { ask(firstQuestion) } }
    }

    private func ask(_ question: String) {
        let q = question.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty, !thinking else { return }
        // The earlier question/answer pairs, so follow-ups make sense.
        var earlier: [(q: String, a: String)] = []
        var i = 0
        while i + 1 < lines.count { earlier.append((lines[i].text, lines[i + 1].text)); i += 2 }
        lines.append(ChatLine(fromYou: true, text: q))
        typed = ""
        thinking = true
        let pack = packs.pack, here = location.lastFix?.point
        Task {
            let answer = await AskBeacon.answer(question: q, earlier: earlier, pack: pack, here: here)
            thinking = false
            lines.append(ChatLine(fromYou: false, text: answer.text, ranOnDevice: answer.ranOnDevice))
        }
    }
}

// Your questions: blue, on the right. Beacon's answers: white, on the left, with the badge underneath.
private struct Bubble: View {
    var line: ChatLine

    var body: some View {
        VStack(alignment: line.fromYou ? .trailing : .leading, spacing: 6) {
            Text(line.text).style(line.fromYou ? .label : .body, color: line.fromYou ? .white : BeaconColors.text)
                .padding(.horizontal, 16).padding(.vertical, 12)
                .background(line.fromYou ? BeaconColors.primary : BeaconColors.surface)
                .clipShape(UnevenRoundedRectangle(topLeadingRadius: 20, bottomLeadingRadius: line.fromYou ? 20 : 6, bottomTrailingRadius: line.fromYou ? 6 : 20, topTrailingRadius: 20, style: .continuous))
            if !line.fromYou && line.text != "…" { InferenceBadge(ranOnDevice: line.ranOnDevice) }
        }
        .frame(maxWidth: 300, alignment: line.fromYou ? .trailing : .leading)
        .frame(maxWidth: .infinity, alignment: line.fromYou ? .trailing : .leading)
    }
}
