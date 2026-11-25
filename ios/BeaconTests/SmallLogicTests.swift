import XCTest
@testable import Beacon

// Short checks for the small pure helpers that have no shared vector file.
final class SmallLogicTests: XCTestCase {
    private let bar = GeoPoint(lat: -22.9095, lng: -43.18421)

    func testDistanceIsInMetres() {
        XCTAssertEqual(GeoPoint(lat: 0, lng: 0).meters(to: GeoPoint(lat: 0.001, lng: 0)), 111.19, accuracy: 0.1)
    }

    func testCoordinatesAlwaysUseADot() {
        XCTAssertEqual(bar.short(), "-22.9095, -43.1842")
        XCTAssertEqual(MapsLink.of(GeoPoint(lat: -22.9133, lng: -43.1801)), "https://maps.google.com/?q=-22.91330,-43.18010")
    }

    func testClockAndDistanceWords() {
        XCTAssertEqual(NearbyFeed.clock(23), "11pm"); XCTAssertEqual(NearbyFeed.clock(0), "midnight"); XCTAssertEqual(NearbyFeed.clock(12), "noon"); XCTAssertEqual(NearbyFeed.clock(5), "5am")
        XCTAssertEqual(NearbyFeed.distance(250), "250 m"); XCTAssertEqual(NearbyFeed.distance(1200), "1.2 km")
    }

    func testPhoneNumbersNeedACountryCode() {
        XCTAssertEqual(PhoneNumber.clean(" +972 50-123 4567 "), "+972501234567")
        XCTAssertTrue(PhoneNumber.isValid("+12035551234"))
        XCTAssertFalse(PhoneNumber.isValid("050 123 4567"))
        XCTAssertFalse(PhoneNumber.isValid("+123"))
    }

    func testCheckInOnlySharesLocationWhenAllowed() {
        XCTAssertEqual(CheckInMessage.build(name: "Noa", city: "Rio de Janeiro", time: "11:45 PM", here: bar, shareLocation: false), "Noa is OK · Rio de Janeiro · 11:45 PM")
        XCTAssertTrue(CheckInMessage.build(name: "Noa", city: "Rio de Janeiro", time: "11:45 PM", here: bar, shareLocation: true).hasSuffix("Where: https://maps.google.com/?q=-22.90950,-43.18421"))
        XCTAssertFalse(CheckInMessage.build(name: "Noa", city: "Rio", time: "1 PM", here: nil, shareLocation: true).contains("Where"))
    }

    func testTheBarSitsWhereTheDrawingShowsIt() throws {
        let spot = try XCTUnwrap(LapaMapProjection.toSpot(bar))
        XCTAssertEqual(spot.x, 78, accuracy: 1); XCTAssertEqual(spot.y, 153, accuracy: 1)
        XCTAssertNil(LapaMapProjection.toSpot(GeoPoint(lat: 0, lng: 0)))
        let back = LapaMapProjection.toGeo(spot)
        XCTAssertEqual(back.lat, bar.lat, accuracy: 1e-9); XCTAssertEqual(back.lng, bar.lng, accuracy: 1e-9)
    }

    func testHeadingPointsTheWayYouWalk() throws {
        XCTAssertNil(Heading.between(bar, GeoPoint(lat: bar.lat + 0.00001, lng: bar.lng))) // about 1 m: standing still
        XCTAssertEqual(try XCTUnwrap(Heading.between(bar, GeoPoint(lat: bar.lat + 0.001, lng: bar.lng))), 0, accuracy: 0.5)   // north
        XCTAssertEqual(try XCTUnwrap(Heading.between(bar, GeoPoint(lat: bar.lat, lng: bar.lng + 0.001))), 90, accuracy: 0.5)  // east
    }

    func testProfileWording() {
        XCTAssertEqual(UserProfile().displayName, "Your contact")
        XCTAssertEqual(UserProfile(name: " Noa ").objectForm, "Noa")
        XCTAssertEqual(UserProfile(name: "Noa").possessive, "Noa's")
        XCTAssertEqual(UserProfile(name: "Noa", pronoun: .she).objectForm, "her")
        XCTAssertEqual(UserProfile(name: "Sam", pronoun: .they).possessive, "their")
    }

    func testNamesJoinLikeASentence() {
        XCTAssertEqual(Names.join([]), ""); XCTAssertEqual(Names.join(["Mom"]), "Mom")
        XCTAssertEqual(Names.join(["Mom", "Dad"]), "Mom and Dad"); XCTAssertEqual(Names.join(["Mom", "Dad", "Alwis"]), "Mom, Dad and Alwis")
    }

    func testSetupOrderAndTheContactRule() {
        XCTAssertEqual(OnboardingSteps.next(.story), .welcome)
        XCTAssertNil(OnboardingSteps.next(.getReady)); XCTAssertNil(OnboardingSteps.previous(.story))
        XCTAssertEqual(OnboardingSteps.progressIndex(.welcome), 0)
        XCTAssertEqual(OnboardingSteps.progressIndex(.getReady), OnboardingSteps.setupSteps - 1)
        XCTAssertFalse(OnboardingSteps.canContinue(.contacts, contactCount: 0)); XCTAssertTrue(OnboardingSteps.canContinue(.contacts, contactCount: 1))
    }
}
