import Foundation

// Loads and saves the safety pack. This is what makes Beacon work offline.
// A saved pack (built on the phone or downloaded later) wins; otherwise the bundled Lapa, Rio pack
// from shared/fixtures/rio-lapa-pack.json is used, the same demo pack as Android and web.
@MainActor
final class PackStore: ObservableObject {
    @Published private(set) var pack: SafetyPack

    private static var savedURL: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("safety_pack.json")
    }

    init() { pack = Self.loadSaved() ?? Self.bundled() }

    var isBundledDemo: Bool { Self.loadSaved() == nil }

    func save(_ pack: SafetyPack) {
        self.pack = pack
        try? FileManager.default.createDirectory(at: Self.savedURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? JSONEncoder().encode(pack).write(to: Self.savedURL, options: .atomic)
    }

    private static func loadSaved() -> SafetyPack? {
        (try? Data(contentsOf: savedURL)).flatMap { try? JSONDecoder().decode(SafetyPack.self, from: $0) }
    }

    // The app cannot work without a pack, so a broken bundle is a build mistake worth stopping on.
    nonisolated static func bundled() -> SafetyPack {
        guard let url = Bundle.main.url(forResource: "rio-lapa-pack", withExtension: "json"),
              let pack = try? JSONDecoder().decode(SafetyPack.self, from: Data(contentsOf: url)) else {
            fatalError("rio-lapa-pack.json is missing from the app bundle (see the Shared group in the Xcode project)")
        }
        return pack
    }
}
