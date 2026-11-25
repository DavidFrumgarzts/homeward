import XCTest

// The map pictures in the iOS asset catalog are copies of docs/design/landmarks (made by
// make_landmarks.py). This fails when a picture changed there and ios/scripts/sync-landmarks.sh was not re-run.
final class AssetsInSyncTests: XCTestCase {
    func testLandmarkPicturesMatchTheOriginals() throws {
        var names = ["arcos", "bar", "catedral", "hospital", "hostel", "police", "steps"].map { ("docs/design/landmarks/\($0).svg", "landmark_\($0)", "\($0).svg") }
        names.append(("docs/design/cop/cop-start-frame.svg", "beacon_cop", "cop-start-frame.svg"))
        for (original, asset, file) in names {
            let copy = "ios/Beacon/Assets.xcassets/\(asset).imageset/\(file)"
            XCTAssertEqual(try Repo.data(copy), try Repo.data(original), "\(copy) is out of date: run sh ios/scripts/sync-landmarks.sh")
        }
    }
}
