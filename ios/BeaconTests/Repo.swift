import Foundation
@testable import Beacon

// Files at the repo root that the tests read straight from disk (the simulator runs on this Mac, so
// it can), so the app's copies and ports are always checked against the shared originals.
enum Repo {
    // ios/BeaconTests/Repo.swift -> the repo root is two folders above this file's folder.
    static let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()

    static func data(_ path: String) throws -> Data { try Data(contentsOf: root.appendingPathComponent(path)) }

    // The demo pack for Lapa, Rio: the same file the app bundles.
    static func rioPack() throws -> SafetyPack { try JSONDecoder().decode(SafetyPack.self, from: data("shared/fixtures/rio-lapa-pack.json")) }
}
