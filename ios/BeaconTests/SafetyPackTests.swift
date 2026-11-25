import XCTest
@testable import Beacon

// The pack must load from the shared fixture, ignore fields it doesn't know and fill in missing optional ones.
final class SafetyPackTests: XCTestCase {
    func testLoadsTheSharedRioFixture() throws {
        let pack = try Repo.rioPack()
        XCTAssertEqual(pack.city, "Rio de Janeiro")
        XCTAssertEqual(pack.police, "190")
        XCTAssertEqual(pack.safePlaces.first?.name, "5º DP police station")
        XCTAssertEqual(pack.zones.first { $0.level == .avoid }?.name, "Rua dos Inválidos")
        XCTAssertEqual(pack.localPhrases.count, 4)
    }

    func testTheBundledPackIsTheSharedFixture() throws {
        XCTAssertEqual(PackStore.bundled(), try Repo.rioPack())
    }

    func testUnknownFieldsAreIgnoredAndMissingOnesGetDefaults() throws {
        let json = """
        {"city":"X","country":"Y","police":"1","ambulance":"2","futureField":{"a":1},
         "safePlaces":[{"name":"P","kind":"police","lat":1,"lng":2,"open24h":false,"somethingNew":true}],
         "zones":[{"name":"Z","level":"Avoid","polygon":[[0,0],[0,1],[1,1]]}]}
        """
        let pack = try JSONDecoder().decode(SafetyPack.self, from: Data(json.utf8))
        XCTAssertEqual(pack.embassyName, "")
        XCTAssertEqual(pack.localPhrases, [])
        XCTAssertEqual(pack.safePlaces[0].opensHour, 0)
        XCTAssertEqual(pack.safePlaces[0].closesHour, 24)
        XCTAssertEqual(pack.zones[0].riskyToHour, 24)
        XCTAssertEqual(pack.zones[0].reasons, [])
        XCTAssertFalse(pack.placesFromOsm)
    }
}
