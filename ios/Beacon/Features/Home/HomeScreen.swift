import SwiftUI

// Home is the map: it follows you while Home is open, shows a red-zone alert on top (plus a buzz)
// when you walk toward one, and has a bottom sheet with Ask Beacon, the nearest place to get help
// and Hold for SOS. This file only wires the pieces together.
struct HomeScreen: View {
    var onAsk: (String) -> Void
    var onEditContacts: () -> Void

    @EnvironmentObject private var store: LocalStore
    @EnvironmentObject private var packs: PackStore
    @EnvironmentObject private var location: LocationService
    @EnvironmentObject private var incident: IncidentEngine
    @State private var detector = ApproachDetector()
    @State private var sheetHeight: CGFloat = 0
    @State private var popup: String?
    @State private var checkIn: ComposeRequest?

    var body: some View {
        let pack = packs.pack
        let here = location.lastFix?.point
        let hour = Clock.hour
        let redZone = here.flatMap { ZoneChecker.redZoneAhead($0, zones: pack.zones, hour: hour) }
        let place = here.flatMap { SafePlacePicker.pick(here: $0, places: pack.safePlaces, hour: hour) }

        ZStack(alignment: .bottom) {
            HomeMap(pack: pack, you: here, bottomCovered: sheetHeight).ignoresSafeArea()

            VStack {
                if let redZone, let here {
                    RedZoneBanner(zone: redZone, meters: Int(ZoneChecker.distanceToZone(here, redZone))) {
                        popup = ([redZone.reasons.map { "• \($0)" }.joined(separator: "\n")] + (place.map { ["Go to: \($0.reason)"] } ?? [])).joined(separator: "\n\n")
                    }
                    .padding(16)
                }
                Spacer()
            }

            HomeSheet(pack: pack, contactNames: Names.join(store.contacts.map(\.name)), place: place,
                      onAsk: onAsk,
                      onPlace: { popup = place?.reason ?? "No open place to get help is saved nearby." },
                      onImOk: imOk,
                      onPolice: { AppServices.dial(pack.police) },
                      onSos: { incident.startSos(method: .sosButton) },
                      onEditContacts: onEditContacts)
                .background(GeometryReader { geo in Color.clear.onAppear { sheetHeight = geo.size.height }.onChange(of: geo.size.height) { sheetHeight = geo.size.height } })
        }
        .onAppear { location.start(for: "home") }
        .onDisappear { location.stop(for: "home") }
        // Walking toward a red zone? Buzz once (ApproachDetector decides when) and the banner shows.
        .onChange(of: location.lastFix) {
            guard let fix = location.lastFix else { return }
            if detector.update(here: fix.point, zones: pack.zones, hour: Clock.hour, nowMillis: Clock.nowMillis) != nil {
                UINotificationFeedbackGenerator().notificationOccurred(.warning)
            }
        }
        .alert("Beacon", isPresented: .constant(popup != nil), actions: { Button("OK") { popup = nil } }, message: { Text(popup ?? "") })
        .sheet(item: $checkIn) { request in
            MessageComposer(request: request) { _ in checkIn = nil }.ignoresSafeArea()
        }
    }

    // "I'm OK": opens Messages with the calm text for every contact. On the simulator, shows the text instead.
    private func imOk() {
        guard !store.contacts.isEmpty else { popup = "Add someone first (Edit)."; return }
        let request = CheckIn.request(store: store, pack: packs.pack, here: location.lastFix?.point)
        if incident.testMode { popup = "Test mode: Messages is not available in the simulator. The text would be:\n\n\(request.body)" }
        else if incident.canSendText() { checkIn = request }
        else { popup = "This device can't send texts." }
    }
}
