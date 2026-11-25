import Foundation

// "I'm OK": the calm text for every trusted contact, with her location only if she allowed that
// in setup. Peace of mind for family without live tracking. The text itself is CheckInMessage (pure).
@MainActor
enum CheckIn {
    static func request(store: LocalStore, pack: SafetyPack, here: GeoPoint?) -> ComposeRequest {
        let text = CheckInMessage.build(name: store.profile.displayName, city: pack.city, time: Clock.timeText(Clock.nowMillis),
                                        here: here, shareLocation: store.shareLocationOnCheckIn)
        return ComposeRequest(kind: .checkIn, recipients: store.contacts.map(\.phone), body: text)
    }
}
