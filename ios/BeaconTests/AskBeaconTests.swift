import XCTest
@testable import Beacon

// Ask Beacon: the prompt hands the model only saved facts, and the no-AI rules answer from the same pack.
final class AskBeaconTests: XCTestCase {
    private let bar = GeoPoint(lat: -22.9095, lng: -43.18421)

    func testPromptCarriesTheSavedFacts() throws {
        let pack = try Repo.rioPack()
        let prompt = AskBeaconPrompt.build(question: "What's the police number?", pack: pack, here: bar, hour: 1)
        XCTAssertTrue(prompt.contains("Police: 190"))
        XCTAssertTrue(prompt.contains(pack.embassyPhone))
        XCTAssertTrue(prompt.contains("Rua dos Inválidos"))
        XCTAssertTrue(prompt.contains("risky right now")) // 1am is inside its risky hours
        XCTAssertTrue(prompt.contains("m from you"))
        XCTAssertTrue(prompt.contains("5º DP police station (police)"))
        XCTAssertFalse(prompt.contains("- Av. Mem de Sá: ")) // a safer street is never listed as one to avoid
        XCTAssertTrue(prompt.hasSuffix("QUESTION: What's the police number?"))
    }

    func testPromptKeepsOnlyTheLastTwoExchanges() throws {
        let earlier = [(q: "one", a: "1"), (q: "two", a: "2"), (q: "Where can I get help?", a: "Yes, open now.")]
        let prompt = AskBeaconPrompt.build(question: "How far?", pack: try Repo.rioPack(), here: nil, hour: 14, earlier: earlier)
        XCTAssertTrue(prompt.contains("Traveler: Where can I get help?\nBeacon: Yes, open now."))
        XCTAssertFalse(prompt.contains("Traveler: one"))
        XCTAssertFalse(prompt.contains("m from you")) // no position, so no distances are claimed
    }

    func testRulesAnswerFromThePackWithNoAI() throws {
        let pack = try Repo.rioPack()
        XCTAssertEqual(AskBeaconRules.answer(question: "What's the police number?", pack: pack, here: bar, hour: 1), "Police: 190. Ambulance: 192.")
        XCTAssertTrue(AskBeaconRules.answer(question: "Where is the embassy?", pack: pack, here: bar, hour: 1).contains("+55 21 3823-2000"))
        XCTAssertTrue(AskBeaconRules.answer(question: "Is this area OK now?", pack: pack, here: bar, hour: 1).contains("which is now"))
        XCTAssertTrue(AskBeaconRules.answer(question: "Is this area OK now?", pack: pack, here: bar, hour: 14).contains("fine at this hour"))
        XCTAssertTrue(AskBeaconRules.answer(question: "Where can I get help?", pack: pack, here: bar, hour: 1).contains("5º DP police station") ||
                      AskBeaconRules.answer(question: "Where can I get help?", pack: pack, here: bar, hour: 1).contains("Hospital Cruz Vermelha"))
        XCTAssertEqual(AskBeaconRules.answer(question: "Tell me a joke", pack: pack, here: bar, hour: 1), "I don't have that saved. Police: 190.")
        XCTAssertTrue(AskBeaconRules.answer(question: "Where can I get help?", pack: pack, here: nil, hour: 1).contains("I don't know where you are yet"))
    }
}
