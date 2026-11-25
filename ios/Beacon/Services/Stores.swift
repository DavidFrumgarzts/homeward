import Foundation

// Small things Beacon remembers on the phone (no account, no server): who she is, who gets the SOS,
// and her choices from setup. Everything is kept in UserDefaults as JSON.
@MainActor
final class LocalStore: ObservableObject {
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) { self.defaults = defaults }

    @Published var profile = UserProfile() { didSet { save(profile, "profile") } }
    @Published var contacts: [TrustedContact] = [] { didSet { save(contacts, "contacts") } }
    // Her choice from setup: may "I'm OK" include where she is? Off by default. An SOS always does.
    @Published var shareLocationOnCheckIn = false { didSet { defaults.set(shareLocationOnCheckIn, forKey: "shareLocationOnCheckIn") } }
    @Published var onboardingDone = false { didSet { defaults.set(onboardingDone, forKey: "onboardingDone") } }

    func load() {
        profile = read("profile") ?? UserProfile()
        contacts = read("contacts") ?? []
        shareLocationOnCheckIn = defaults.bool(forKey: "shareLocationOnCheckIn")
        onboardingDone = defaults.bool(forKey: "onboardingDone")
    }

    // Starts over (used by the debug launch argument -resetBeacon).
    func reset() {
        ["profile", "contacts", "shareLocationOnCheckIn", "onboardingDone"].forEach { defaults.removeObject(forKey: $0) }
        load()
    }

    private func save<T: Encodable>(_ value: T, _ key: String) {
        if let data = try? JSONEncoder().encode(value) { defaults.set(data, forKey: key) }
    }

    private func read<T: Decodable>(_ key: String) -> T? {
        defaults.data(forKey: key).flatMap { try? JSONDecoder().decode(T.self, from: $0) }
    }
}
