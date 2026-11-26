import SwiftUI

// One line of the chat. `fromYou` = the traveler's question; otherwise Beacon's answer, with where it was written.
private struct ChatLine: Identifiable, Equatable {
    let id = UUID()
    var fromYou: Bool
    var text: String
    var ranOnDevice: Bool? = nil
}

// Chat with Beacon (Figma "08 Ask Beacon"): the cop at the top, your question in a blue bubble,
// Beacon's answer on a full-width white card (numbered steps when it gives steps) with an
// "On device" / "Cloud" badge, and a box at the bottom to type the next one. It keeps the last answers in mind for follow-ups.
// `firstQuestion` is what was tapped on Home ("" opens an empty chat).
struct AskBeaconScreen: View {
    var firstQuestion: String

    @EnvironmentObject private var packs: PackStore
    @EnvironmentObject private var location: LocationService
    @Environment(\.dismiss) private var dismiss
    @State private var lines: [ChatLine] = []
    @State private var typed = ""
    @State private var thinking = false
    @State private var asked = 0          // haptic trigger: a question was sent
    @FocusState private var typing: Bool

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                HStack { BackButton { dismiss() }; Spacer() }
                BeaconCop(lively: thinking)
            }
            .padding(.bottom, -12) // the cop picture has empty room under his feet
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        ForEach(lines) { line in
                            Group {
                                if line.fromYou { QuestionBubble(text: line.text) }
                                else { AnswerCard(text: line.text, ranOnDevice: line.ranOnDevice, city: packs.pack.city) }
                            }
                            .id(line.id)
                        }
                        if thinking { ThinkingCard().id("thinking") }
                        if lines.isEmpty && !thinking {
                            QuickPickChips(options: ["What's the police number?", "Is this area OK now?", "Where can I get help?"]) { ask($0) }.padding(.top, 8)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 16)
                }
                .scrollIndicators(.hidden)
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: lines) { withAnimation { proxy.scrollTo(lines.last?.id, anchor: .bottom) } }
                // The keyboard pushes the box up (the screen keeps out of its way); keep the newest answer in sight.
                .onChange(of: typing) { if typing, let last = lines.last?.id { withAnimation { proxy.scrollTo(last, anchor: .bottom) } } }
            }
            AskBox(icon: "arrow.up", iconLabel: "Send", action: { ask(typed) }) {
                TextField(lines.isEmpty ? "Ask Beacon anything" : "Ask a follow-up", text: $typed).beaconFont(.body).foregroundStyle(BeaconColors.text)
                    .submitLabel(.send).onSubmit { ask(typed) }.focused($typing)
            }
        }
        .padding(.horizontal, BeaconSpacing.sheet).padding(.vertical, 12)
        .background(BeaconColors.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .sensoryFeedback(.impact(weight: .light), trigger: asked)
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
        asked += 1
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

// Your question (Figma "08"): a blue bubble on the left, in quotes like the design.
private struct QuestionBubble: View {
    var text: String

    var body: some View {
        Text("\u{201C}\(text)\u{201D}").style(.label, color: .white)
            .padding(.horizontal, 16).padding(.vertical, 12)
            .background(BeaconColors.primary)
            .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.button, style: .continuous))
            .frame(maxWidth: 320, alignment: .leading)
            .accessibilityLabel("You asked: \(text)")
    }
}

// Beacon's answer (Figma "08"): a full-width white card. When the answer is a list of numbered steps,
// the line before them is the heading and each step gets a number on a light blue circle. Underneath:
// where it was written (On device / Cloud / No AI) and that it came from the saved pack.
private struct AnswerCard: View {
    var text: String
    var ranOnDevice: Bool?
    var city: String

    var body: some View {
        let parts = AnswerParts(text)
        WhiteCard(padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                if let heading = parts.heading {
                    Text(heading).style(parts.steps.isEmpty ? .body : .heading).fixedSize(horizontal: false, vertical: true)
                }
                ForEach(Array(parts.steps.enumerated()), id: \.offset) { index, step in
                    NumberedStep(number: index + 1, text: step)
                }
                if let after = parts.after {
                    Text(after).style(.body).fixedSize(horizontal: false, vertical: true)
                }
                VStack(alignment: .leading, spacing: 8) {
                    InferenceBadge(ranOnDevice: ranOnDevice)
                    Text("From your \(city) pack, saved on this phone.").style(.small)
                }
                .padding(.top, 2)
            }
        }
        .textSelection(.enabled)
    }
}

// Splits an answer into the line before the steps, the numbered steps ("1. …" or "1) …"), and anything after.
// Only for display: the answer text itself is unchanged. With no numbered lines, it is all `heading`.
private struct AnswerParts {
    var heading: String?
    var steps: [String] = []
    var after: String?

    init(_ text: String) {
        var before: [String] = [], after: [String] = []
        for raw in text.split(separator: "\n", omittingEmptySubsequences: true) {
            let line = raw.trimmingCharacters(in: .whitespaces)
            if line.isEmpty { continue }
            if let step = Self.step(line), after.isEmpty { steps.append(step) }
            else if steps.isEmpty { before.append(line) }
            else { after.append(line) }
        }
        heading = before.isEmpty ? nil : before.joined(separator: "\n")
        self.after = after.isEmpty ? nil : after.joined(separator: "\n")
    }

    // "2. Pass the police station" -> "Pass the police station"; nil when the line is not a numbered step.
    private static func step(_ line: String) -> String? {
        let digits = line.prefix { $0.isASCII && $0.isNumber }
        guard !digits.isEmpty, digits.count <= 2 else { return nil }
        let rest = line.dropFirst(digits.count)
        guard let mark = rest.first, mark == "." || mark == ")" else { return nil }
        let body = rest.dropFirst().trimmingCharacters(in: .whitespaces)
        return body.isEmpty ? nil : body
    }
}

// While Beacon is working on an answer: a small white card with three dots.
private struct ThinkingCard: View {
    var body: some View {
        Text("…").style(.heading, color: BeaconColors.textMuted)
            .padding(.horizontal, 18).padding(.vertical, 10)
            .background(BeaconColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: BeaconRadius.bubble, style: .continuous))
            .accessibilityLabel("Beacon is answering")
    }
}
