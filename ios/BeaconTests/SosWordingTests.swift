import XCTest
@testable import Beacon

// The SOS message writer always returns a usable sentence, and the iOS "sent" screen never claims
// more than what really happened.
final class SosWordingTests: XCTestCase {
    private let noa = UserProfile(name: "Noa")

    func testWriterUsesTheAiSentence() async {
        let writer = SosMessageWriter(ask: { _ in AiAnswer(text: " \"Noa is being followed by a man in a grey hoodie.\" ", ranOnDevice: true) })
        let sentence = await writer.write(profile: noa, note: "guy following me, grey hoodie")
        XCTAssertEqual(sentence, .init(text: "Noa is being followed by a man in a grey hoodie.", ranOnDevice: true))
    }

    func testWriterFallsBackToThePlainSentence() async {
        struct NoModel: Error {}
        let failing = SosMessageWriter(ask: { _ in throw NoModel() })
        let failed = await failing.write(profile: noa, note: "being followed")
        XCTAssertEqual(failed, .init(text: "Noa needs help: being followed.", ranOnDevice: nil))
        let rambling = SosMessageWriter(ask: { _ in AiAnswer(text: String(repeating: "word ", count: 200), ranOnDevice: false) })
        let rambled = await rambling.write(profile: noa, note: "lost")
        XCTAssertNil(rambled.ranOnDevice)
    }

    func testWriterDoesNotCallTheModelForAnEmptyNote() async {
        let writer = SosMessageWriter(ask: { _ in XCTFail("no AI call for an empty note"); return AiAnswer(text: "x", ranOnDevice: true) })
        let sentence = await writer.write(profile: noa, note: "  ")
        XCTAssertEqual(sentence.text, "Noa needs help.")
    }

    func testPromptNeverContainsLocationOrNumbers() {
        let prompt = SosPrompt.build(profile: UserProfile(name: "Noa", pronoun: .she), note: "followed since the bar")
        XCTAssertTrue(prompt.contains("Note from Noa: \"followed since the bar\""))
        XCTAssertTrue(prompt.contains("Use \"she\" and \"her\""))
        XCTAssertFalse(prompt.contains("190")); XCTAssertFalse(prompt.contains("maps.google"))
    }

    func testSentOnlyWhenShePressedSend() {
        let names = ["Mom", "Dad"]
        let sent = SosPathWording.summarize(names: names, messages: .sent, link: .upToDate)
        XCTAssertEqual(sent.headline, "Sent to Mom and Dad"); XCTAssertTrue(sent.sent)
        XCTAssertTrue(sent.lines.contains("Live link is up to date."))
        XCTAssertFalse(sent.headline.contains("know")) // an iPhone can never say a contact knows

        let cancelled = SosPathWording.summarize(names: names, messages: .cancelled, link: .savedOnPhone)
        XCTAssertEqual(cancelled.headline, "Not sent yet"); XCTAssertFalse(cancelled.sent)
        XCTAssertTrue(cancelled.lines.contains("Saved on your phone. The live link updates when you have signal."))

        let test = SosPathWording.summarize(names: names, messages: .testMode, link: .failed)
        XCTAssertEqual(test.headline, "Test mode: Messages is not available in the simulator"); XCTAssertFalse(test.sent)

        let nobody = SosPathWording.summarize(names: [], messages: .sent, link: .upToDate)
        XCTAssertEqual(nobody.headline, "No one to send to yet"); XCTAssertFalse(nobody.sent)
    }
}
