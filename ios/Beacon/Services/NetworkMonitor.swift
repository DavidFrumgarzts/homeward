import Foundation
import Network

// Answers one question: does the phone have a working connection right now?
// Used to say honestly whether live updates can leave the phone, and to count points while they can't.
@MainActor
final class NetworkMonitor: ObservableObject {
    @Published private(set) var isOnline = true
    var onChange: ((Bool) -> Void)?

    private let monitor = NWPathMonitor()

    func start() {
        monitor.pathUpdateHandler = { [weak self] path in
            let online = path.status == .satisfied
            Task { @MainActor in
                guard let self, self.isOnline != online else { return }
                self.isOnline = online
                self.onChange?(online)
            }
        }
        monitor.start(queue: DispatchQueue(label: "beacon.network"))
    }
}
