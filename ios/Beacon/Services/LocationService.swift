import CoreLocation
import Foundation

// The phone's position, straight from GPS (works with no signal). Location is only read while
// something needs it: Home is open ("home") or an SOS she started is running ("sos"). When the last
// user stops, updates stop.
@MainActor
final class LocationService: NSObject, ObservableObject {
    @Published private(set) var lastFix: LocationFix?
    @Published private(set) var status: CLAuthorizationStatus = .notDetermined
    var onFix: ((LocationFix) -> Void)?

    private let manager = CLLocationManager()
    private var users: Set<String> = []

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        status = manager.authorizationStatus
    }

    var allowed: Bool { status == .authorizedWhenInUse || status == .authorizedAlways }

    func askPermission() { manager.requestWhenInUseAuthorization() }

    func start(for user: String) {
        users.insert(user)
        // An SOS wants every move; the map is fine with a fix every 10 m.
        manager.distanceFilter = users.contains("sos") ? kCLDistanceFilterNone : 10
        if allowed { manager.startUpdatingLocation() }
    }

    func stop(for user: String) {
        users.remove(user)
        if users.isEmpty { manager.stopUpdatingLocation() } else { start(for: users.first!) }
    }
}

extension LocationService: CLLocationManagerDelegate {
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let last = locations.last else { return }
        let fix = LocationFix(point: GeoPoint(lat: last.coordinate.latitude, lng: last.coordinate.longitude),
                              takenAtMillis: Millis(last.timestamp.timeIntervalSince1970 * 1000),
                              accuracyMeters: last.horizontalAccuracy >= 0 ? last.horizontalAccuracy : nil)
        Task { @MainActor in
            self.lastFix = fix
            self.onFix?(fix)
        }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            self.status = status
            if self.allowed, !self.users.isEmpty { self.manager.startUpdatingLocation() }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}
}
