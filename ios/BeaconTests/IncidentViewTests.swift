import XCTest
@testable import Beacon

// What the SOS screens are given to draw, and what is saved for the family link.
final class IncidentViewTests: XCTestCase {
    private let bar = LocationFix(point: GeoPoint(lat: -22.9095, lng: -43.18421), takenAtMillis: 1_000_000, accuracyMeters: 8)

    private func active(_ description: String, fix: LocationFix?) -> IncidentState {
        let input = IncidentInput(sessionId: "s1", method: .sosButton, userConfirmed: true, description: description, location: fix, startedAtMillis: 1_000_000)
        return IncidentReducer.reduce(IncidentState(), .startSos(input), now: 1_000_000).state
    }

    func testInactiveShowsOnlyThePoliceNumber() throws {
        let view = IncidentViewStateMapper.map(IncidentState(), pack: try Repo.rioPack(), hour: 1, nowMillis: 0)
        XCTAssertEqual(view.phase, .inactive); XCTAssertEqual(view.emergencyNumber, "190"); XCTAssertTrue(view.forMe.isEmpty)
    }

    func testTheThreeCardsComeFromThePack() throws {
        let view = IncidentViewStateMapper.map(active("Being followed", fix: bar), pack: try Repo.rioPack(), hour: 1, nowMillis: 1_000_000)
        XCTAssertEqual(view.forMe, ActionChecklist.steps(for: .followed))
        XCTAssertEqual(view.emergencyNumber, "190"); XCTAssertEqual(view.emergencyLabel, "police")
        XCTAssertNotNil(view.suggestedPlace)
        XCTAssertEqual(view.showNearby?.local, "Estou sendo seguida")
        XCTAssertEqual(view.lastFix, bar)
    }

    func testMedicalUsesTheAmbulanceNumber() throws {
        let view = IncidentViewStateMapper.map(active("I'm hurt", fix: bar), pack: try Repo.rioPack(), hour: 1, nowMillis: 1_000_000)
        XCTAssertEqual(view.emergencyNumber, "192"); XCTAssertEqual(view.emergencyLabel, "ambulance")
    }

    func testNoFixMeansNoSuggestedPlace() throws {
        XCTAssertNil(IncidentViewStateMapper.map(active("Lost", fix: nil), pack: try Repo.rioPack(), hour: 1, nowMillis: 1_000_000).suggestedPlace)
    }

    func testSafetyCheckCountsDownAndStopsAtZero() throws {
        var state = IncidentState(); state.phase = .safetyCheckRequested; state.check = SafetyCheck(urgent: true, deadlineMillis: 30_000)
        let pack = try Repo.rioPack()
        XCTAssertEqual(IncidentViewStateMapper.map(state, pack: pack, hour: 1, nowMillis: 500).safetyCheckSecondsLeft, 30)
        XCTAssertEqual(IncidentViewStateMapper.map(state, pack: pack, hour: 1, nowMillis: 29_001).safetyCheckSecondsLeft, 1)
        XCTAssertEqual(IncidentViewStateMapper.map(state, pack: pack, hour: 1, nowMillis: 99_000).safetyCheckSecondsLeft, 0)
    }

    func testTheSavedIncidentUsesTheSharedFieldNames() throws {
        let pack = try Repo.rioPack()
        var state = active("Being followed", fix: bar)
        XCTAssertNotNil(IncidentRecord(state: state, profile: UserProfile(name: "Noa"), pack: pack, now: 1_000_500))
        state = IncidentReducer.reduce(state, .send(message: "Noa needs help."), now: 1_020_000).state
        let record = try XCTUnwrap(IncidentRecord(state: state, profile: UserProfile(name: "Noa"), pack: pack, now: 1_020_000))
        let fields = record.fields(tripId: "t1")
        // Every required field of shared/schema/incident.schema.json except ownerUid, which IncidentSync adds after sign-in.
        let schema = try JSONSerialization.jsonObject(with: Repo.data("shared/schema/incident.schema.json")) as? [String: Any]
        let required = Set((schema?["required"] as? [String]) ?? []).subtracting(["ownerUid"])
        XCTAssertFalse(required.isEmpty)
        XCTAssertTrue(required.isSubset(of: Set(fields.keys)), "missing: \(required.subtracting(fields.keys))")
        XCTAssertEqual(fields["phase"] as? String, "SosActive"); XCTAssertEqual(fields["situation"] as? String, "followed")
        XCTAssertEqual(fields["platform"] as? String, "ios"); XCTAssertEqual(fields["message"] as? String, "Noa needs help.")
        XCTAssertEqual(fields["alertSentAtMillis"] as? Int64, 1_020_000)
        XCTAssertNil(IncidentRecord(state: IncidentState(), profile: UserProfile(), pack: pack, now: 0)) // nothing to save when inactive
    }
}
