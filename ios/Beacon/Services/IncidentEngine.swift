import Foundation

// A request for the screen to open Messages with these people and this text filled in.
struct ComposeRequest: Identifiable, Equatable, Sendable {
    enum Kind: Sendable { case alert, ended, checkIn }
    let id = UUID()
    var kind: Kind
    var recipients: [String]
    var body: String
}

enum ComposeOutcome: Sendable { case sent, cancelled, failed }

// PROCESSING: owns the incident. The only writer of IncidentViewState, which the SOS screens draw.
// All decisions are made by IncidentReducer (pure, shared test vectors); this class feeds it events
// and runs the effects (IncidentEngine+Effects.swift). The iOS twin of Android's IncidentEngine.kt.
@MainActor
final class IncidentEngine: ObservableObject {
    @Published private(set) var view = IncidentViewState()
    @Published var compose: ComposeRequest?                 // set when Messages should open
    @Published var messages: MessagesPath = .notOpened      // what happened in Messages
    @Published var endedText: String?                       // the "SOS is over" text for contacts, once it has ended

    private(set) var state = IncidentState()
    let store: LocalStore, packs: PackStore, location: LocationService, network: NetworkMonitor, sync: IncidentSync
    var writer = SosMessageWriter()
    var canSendText: () -> Bool = { false }                 // set by AppServices (asks MessageUI)
    var dial: (String) -> Void = { _ in }
    var batteryPercent: () -> Int? = { nil }
    var sentence = ""                                       // what is happening, AI-rewritten or plain
    var writing: Task<Void, Never>?
    private var ticker: Task<Void, Never>?

    init(store: LocalStore, packs: PackStore, location: LocationService, network: NetworkMonitor, sync: IncidentSync) {
        self.store = store; self.packs = packs; self.location = location; self.network = network; self.sync = sync
    }

    // Test mode (debug builds: always on the simulator, and on a real iPhone unless launched with
    // -realTexts YES): Messages is not opened; the screen says so and shows the text instead. See TestMode.swift.
    var testMode: Bool { TestMode.isOn }

    // ---- Intents: the small set of things screens and triggers may ask for ----
    func startSos(method: ActivationMethod, description: String = "", reasons: [String] = []) {
        let input = IncidentInput(sessionId: UUID().uuidString.lowercased(), method: method, userConfirmed: true,
                                  description: description.trimmingCharacters(in: .whitespacesAndNewlines), triggerReasons: reasons,
                                  location: location.lastFix, online: network.isOnline, startedAtMillis: Clock.nowMillis)
        messages = .notOpened
        endedText = nil
        dispatch(.startSos(input))
        dispatch(.signal(canSend: network.isOnline))
        describe(state.description) // sets the plain message at once, and asks the AI if there are words
    }

    func describe(_ text: String) {
        dispatch(.describe(text: text, plainMessage: composeAlert(IncidentMessages.plainSentence(profile: store.profile, description: text))))
    }

    func editMessage(_ text: String) { dispatch(.editMessage(text)) }

    // Sends what she sees. If she didn't edit it by hand, the facts are refreshed with her newest location first.
    func send() { dispatch(.send(message: state.messageEdited ? state.message : composeLatest())) }

    func imOk() { dispatch(.imOk) }       // the screen has already asked "are you sure?"
    func cancel() { dispatch(.cancel) }   // backed out before sending anything
    func reset() { dispatch(.reset); messages = .notOpened; endedText = nil }
    func callEmergency() { dial(view.emergencyNumber) }

    // ---- Events from the phone ----
    func onLocation(_ fix: LocationFix) {
        let hadFix = state.lastFix != nil
        dispatch(.location(fix))
        // The first fix after she opened the SOS: put it into the draft, unless she is editing it herself.
        if !hadFix, state.phase == .sosActive, !state.alertSent, !state.messageEdited, !state.writing {
            dispatch(.messageWritten(forDescription: state.description, message: composeLatest(), ranOnDevice: state.messageRanOnDevice))
        }
    }

    func onNetwork(_ online: Bool) {
        dispatch(.signal(canSend: online))
        if online { sync.retry() }
    }

    func dispatch(_ event: IncidentEvent) {
        let result = IncidentReducer.reduce(state, event, now: Clock.nowMillis)
        state = result.state
        publish()
        result.effects.forEach { run($0, result.state) }
        keepTime()
    }

    func publish() {
        view = IncidentViewStateMapper.map(state, pack: packs.pack, hour: Clock.hour, nowMillis: Clock.nowMillis, testMode: testMode)
    }

    // While something is active, time has to pass: the safety-check countdown every second, and during
    // an SOS a slower beat that re-checks the connection and battery and sends the 5-minute update. No AI here.
    private func keepTime() {
        let active = state.phase == .sosActive || state.phase == .safetyCheckRequested
        if !active { ticker?.cancel(); ticker = nil; return }
        if ticker != nil { return }
        ticker = Task { [weak self] in
            while !Task.isCancelled {
                let checking = self?.state.phase == .safetyCheckRequested
                try? await Task.sleep(nanoseconds: checking ? 1_000_000_000 : 15_000_000_000)
                guard let self, !Task.isCancelled else { return }
                if self.state.phase == .sosActive {
                    self.dispatch(.signal(canSend: self.network.isOnline))
                    if let percent = self.batteryPercent() { self.dispatch(.battery(percent: percent)) }
                }
                self.dispatch(.tick)
            }
        }
    }
}
