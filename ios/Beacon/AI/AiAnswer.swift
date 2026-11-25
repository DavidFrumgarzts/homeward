import Foundation

// What every AI call returns: the text, and whether it ran on the phone or in the cloud.
// `ranOnDevice` drives the "On device" / "Cloud" badge.
struct AiAnswer: Equatable, Sendable {
    var text: String
    var ranOnDevice: Bool
}

// Raised when an AI call takes too long. Callers then use their non-AI fallback.
struct AiTimeout: Error {}

// Runs `work`, but gives up after `seconds` so a screen is never stuck on "Writing…".
func withTimeout<T: Sendable>(seconds: Double, _ work: @escaping @Sendable () async throws -> T) async throws -> T {
    try await withThrowingTaskGroup(of: T.self) { group in
        group.addTask { try await work() }
        group.addTask {
            try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            throw AiTimeout()
        }
        defer { group.cancelAll() }
        return try await group.next()!
    }
}
