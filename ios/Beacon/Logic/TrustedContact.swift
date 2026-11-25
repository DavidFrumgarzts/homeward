import Foundation

// A person who gets the SOS. Only these people ever see the exact location.
struct TrustedContact: Codable, Equatable, Identifiable, Sendable {
    var name: String
    var phone: String

    var id: String { "\(name)|\(phone)" }
    var initial: String { name.first.map { String($0).uppercased() } ?? "?" }
}
