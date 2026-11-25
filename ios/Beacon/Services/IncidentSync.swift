@preconcurrency import FirebaseFirestore
import Foundation

// Writes an incident and its location updates to Firestore, in the shape shared/schema/README.md
// defines, so trusted contacts can follow the family link. Writes made with no connection stay on
// the phone and go out later; `link` says honestly which of those it is.
@MainActor
final class IncidentSync: ObservableObject {
    @Published private(set) var link: LinkPath = .upToDate

    private let defaults = UserDefaults.standard
    private var pending = 0              // writes the server has not confirmed yet
    private var failed = false
    private var waiting: [@MainActor (String) -> Void] = []  // writes made before the first sign-in

    // Ids are made on the phone, so the family link exists before there is any connection.
    var tripId: String { id("tripId") { UUID().uuidString.lowercased() } }
    // 32 hex characters = 128 random bits: knowing the link is the permission, so it must be unguessable.
    var shareId: String { id("shareId") { (0..<16).map { _ in String(format: "%02x", UInt8.random(in: 0...255)) }.joined() } }
    var familyLink: String { "https://homeward-6999c.web.app/f/\(shareId)" }

    // The trip, its share, the incident and its first update ("alert"), in that order.
    func startIncident(_ incident: IncidentRecord, fix: LocationFix?, battery: Int?) {
        let trip = incident.tripFields, share = ["tripId": tripId, "contactLabel": "Trusted contacts", "createdAtMillis": incident.startedAtMillis, "revoked": false] as [String: Any]
        write { db, uid in db.collection("trips").document(self.tripId).setData(trip.merging(["ownerUid": uid]) { $1 }, merge: true, completion: self.completion("trips/\(SyncLog.short(self.tripId))")) }
        write { db, uid in db.collection("shares").document(self.shareId).setData(share.merging(["ownerUid": uid]) { $1 }, merge: true, completion: self.completion("shares/\(SyncLog.short(self.shareId))")) }
        saveIncident(incident)
        addUpdate(incidentId: incident.id, kind: "alert", fix: fix, battery: battery, pointsHeld: 0, onConfirmed: nil)
    }

    func saveIncident(_ incident: IncidentRecord) {
        let fields = incident.fields(tripId: tripId)
        let path = "trips/\(SyncLog.short(tripId))/incidents/\(SyncLog.short(incident.id)) (phase \(incident.phase.rawValue))"
        write { db, uid in self.incidentRef(db, incident.id).setData(fields.merging(["ownerUid": uid]) { $1 }, merge: true, completion: self.completion(path)) }
    }

    // `onConfirmed` runs when the server has the update, i.e. it really left the phone.
    func addUpdate(incidentId: String, kind: String, fix: LocationFix?, battery: Int?, pointsHeld: Int, onConfirmed: (@MainActor @Sendable () -> Void)?) {
        let now = Clock.nowMillis
        let fields: [String: Any] = [
            "kind": kind, "lat": fix.map { $0.point.lat as Any } ?? NSNull(), "lng": fix.map { $0.point.lng as Any } ?? NSNull(),
            "takenAtMillis": fix.map { $0.takenAtMillis as Any } ?? NSNull(), "accuracyMeters": fix?.accuracyMeters.map { $0 as Any } ?? NSNull(),
            "batteryPercent": battery.map { $0 as Any } ?? NSNull(), "pointsHeld": pointsHeld, "createdAtMillis": now,
        ]
        let path = "trips/\(SyncLog.short(tripId))/incidents/\(SyncLog.short(incidentId))/updates/\(now)-\(kind)"
        write { db, uid in
            self.incidentRef(db, incidentId).collection("updates").document("\(now)-\(kind)").setData(fields.merging(["ownerUid": uid]) { $1 }, completion: self.completion(path) {
                onConfirmed?()
                self.readBack(incidentId)
            })
        }
    }

    // Called when the connection or the sign-in comes back: sends what was waiting for a uid.
    func retry() {
        FirebaseSetup.signIn()
        guard let uid = FirebaseSetup.uid, !waiting.isEmpty else { return }
        let jobs = waiting
        waiting = []
        jobs.forEach { $0(uid) }
    }

    private func incidentRef(_ db: Firestore, _ id: String) -> DocumentReference {
        db.collection("trips").document(tripId).collection("incidents").document(id)
    }

    private func write(_ job: @escaping @MainActor (Firestore, String) -> Void) {
        guard FirebaseSetup.started else { return } // unit tests: no Firebase
        pending += 1
        if let uid = FirebaseSetup.uid { job(Firestore.firestore(), uid) } else { waiting.append { job(Firestore.firestore(), $0) } }
        refresh()
    }

    // Firestore calls back when the server has the write (or refused it). That can be much later,
    // after the connection returns, and on any thread: hop to the main actor before touching state.
    private func completion(_ path: String, _ onConfirmed: (@MainActor @Sendable () -> Void)? = nil) -> @Sendable (Error?) -> Void {
        { [weak self] error in
            let problem = error?.localizedDescription
            Task { @MainActor in
                self?.done(path, problem)
                if problem == nil { onConfirmed?() }
            }
        }
    }

    private func done(_ path: String, _ problem: String?) {
        pending = max(0, pending - 1)
        failed = problem != nil
        if let problem { SyncLog.refused(path, problem) } else { SyncLog.accepted(path) }
        refresh()
    }

    // Debug builds only: after an update is accepted, read the incident back FROM THE SERVER (not the
    // phone's own copy) and log what is there, so a tester has proof the family link has data.
    private func readBack(_ incidentId: String) {
        #if DEBUG
        let ref = incidentRef(Firestore.firestore(), incidentId)
        ref.getDocument(source: .server) { snapshot, error in
            let phase = snapshot?.data()?["phase"] as? String ?? "missing"
            ref.collection("updates").getDocuments(source: .server) { updates, updatesError in
                let kinds = (updates?.documents ?? []).compactMap { $0.data()["kind"] as? String }.joined(separator: ", ")
                let problem = (error ?? updatesError)?.localizedDescription
                Task { @MainActor in
                    SyncLog.note(problem.map { "read-back from server failed: \($0)" } ?? "read-back from server: incident phase \(phase), updates [\(kinds)]")
                }
            }
        }
        #endif
    }

    private func refresh() {
        link = !waiting.isEmpty ? .waitingForFirstConnection : failed ? .failed : pending > 0 ? .savedOnPhone : .upToDate
    }

    private func id(_ key: String, make: () -> String) -> String {
        if let saved = defaults.string(forKey: key) { return saved }
        let made = make()
        defaults.set(made, forKey: key)
        return made
    }
}
