import Foundation

// PURE LOGIC: the incident state machine. (state, event, time) -> new state + what the engine must do.
//   Inactive -> SafetyCheckRequested -> SosActive -> Resolved, and Inactive -> SosActive for confirmed triggers.
// No UIKit, no AI, no clock of its own: time is passed in. A line-for-line port of Android's
// IncidentReducer.kt; both run shared/test-vectors/incident-machine.json.
// Only she can stand an alert down: nothing here lets a model or a timer cancel a check or an SOS.
enum IncidentReducer {
    struct Result: Equatable, Sendable {
        var state: IncidentState
        var effects: [IncidentEffect] = []
    }

    static let lowBattery = 15

    static func reduce(_ state: IncidentState, _ event: IncidentEvent, now: Millis) -> Result {
        switch event {
        case .startSos(let input):
            return state.phase == .sosActive ? Result(state: state) : startSos(state, input, now, trail: [input.location].compactMap { $0 })
        case .raiseSafetyCheck(let input, let urgent):
            return raiseCheck(state, input, urgent, now)
        case .answerSafetyCheck(let ok):
            return answerCheck(state, ok: ok, now)
        case .tick:
            return tick(state, now)
        case .describe(let text, let plainMessage):
            guard state.phase == .sosActive else { return Result(state: state) }
            let rewrite = !text.isBlank && !state.messageEdited
            var next = state
            next.description = text
            next.situation = SituationPicker.pick(text)
            next.writing = rewrite
            if !state.messageEdited { next.message = plainMessage; next.messageRanOnDevice = nil }
            return Result(state: next, effects: rewrite ? [.writeMessage(description: text)] : [])
        case .messageWritten(let forDescription, let message, let ranOnDevice):
            if state.phase != .sosActive || forDescription != state.description { return Result(state: state) } // a late answer for older words
            var next = state
            next.writing = false
            if !state.messageEdited { next.message = message; next.messageRanOnDevice = ranOnDevice }
            return Result(state: next)
        case .editMessage(let text):
            guard state.phase == .sosActive else { return Result(state: state) }
            var next = state
            next.message = text; next.messageEdited = true; next.writing = false
            return Result(state: next)
        case .send(let message):
            if state.phase != .sosActive || message.isBlank { return Result(state: state) }
            var next = state
            next.message = message; next.alertSent = true; next.writing = false
            next.lastSentFix = state.lastFix; next.lastSentAtMillis = now; next.pointsHeld = 0
            return Result(state: next, effects: [.sendAlert(message: message)])
        case .delivery(let delivery):
            if state.phase == .inactive { return Result(state: state) }
            var next = state
            next.deliveries = state.deliveries.filter { $0.contactName != delivery.contactName } + [delivery]
            return Result(state: next)
        case .updateConfirmed(let atMillis):
            if state.phase == .inactive { return Result(state: state) }
            var next = state
            next.lastUpdateConfirmedAtMillis = atMillis
            return Result(state: next)
        case .location(let fix):
            return location(state, fix, now)
        case .signal(let canSend):
            var next = state
            next.canSend = canSend
            return Result(state: next, effects: canSend && !state.canSend ? [.flushOutbox] : [])
        case .battery(let percent):
            guard state.phase == .sosActive, state.alertSent, percent < lowBattery, !state.batteryLowSent else { return Result(state: state) }
            var next = state
            next.batteryLowSent = true
            return Result(state: next, effects: [.sendBatteryLow(fix: state.lastFix)])
        case .imOk:
            switch state.phase {
            case .sosActive:
                var next = state
                next.phase = .resolved; next.endedAtMillis = now; next.writing = false
                return Result(state: next, effects: (state.alertSent ? [.sendEnded] : []) + [.stopSession])
            case .safetyCheckRequested:
                return answerCheck(state, ok: true, now)
            default:
                return Result(state: state)
            }
        case .cancel:
            return state.phase == .sosActive && !state.alertSent ? Result(state: cleared(state), effects: [.stopSession]) : Result(state: state)
        case .reset:
            return state.phase == .resolved ? Result(state: cleared(state)) : Result(state: state)
        }
    }

    private static func cleared(_ state: IncidentState) -> IncidentState { IncidentState(canSend: state.canSend) }

    // A confirmed trigger: she is in the SOS and writes the message herself. An unconfirmed one
    // (she never answered) sends the fixed automatic alert straight away.
    private static func startSos(_ state: IncidentState, _ input: IncidentInput, _ now: Millis, trail: [LocationFix]) -> Result {
        var active = IncidentState(phase: .sosActive, input: input, description: input.description,
                                   situation: SituationPicker.pick(input.description), trail: trail, canSend: state.canSend)
        if input.userConfirmed { return Result(state: active, effects: [.startSession]) }
        active.alertSent = true; active.lastSentFix = active.lastFix; active.lastSentAtMillis = now
        return Result(state: active, effects: [.startSession, .sendAutoAlert])
    }

    private static func raiseCheck(_ state: IncidentState, _ input: IncidentInput, _ urgent: Bool, _ now: Millis) -> Result {
        if state.phase == .inactive {
            let next = IncidentState(phase: .safetyCheckRequested, input: input, trail: [input.location].compactMap { $0 },
                                     canSend: state.canSend, check: check(urgent: urgent, now))
            return Result(state: next, effects: [.askSafetyCheck(urgent: urgent)])
        }
        // A quiet check is already showing and things got worse: make it urgent, with a fresh, shorter countdown.
        if state.phase == .safetyCheckRequested, let current = state.check, !current.urgent, urgent {
            var next = state
            next.input = input
            next.check = check(urgent: true, now, repeated: current.repeated)
            return Result(state: next, effects: [.askSafetyCheck(urgent: true)])
        }
        return Result(state: state)
    }

    private static func check(urgent: Bool, _ now: Millis, repeated: Bool = false) -> SafetyCheck {
        SafetyCheck(urgent: urgent, deadlineMillis: now + (urgent ? SafetyCheck.urgentMillis : SafetyCheck.quietMillis), repeated: repeated)
    }

    private static func answerCheck(_ state: IncidentState, ok: Bool, _ now: Millis) -> Result {
        guard state.phase == .safetyCheckRequested, var input = state.input else { return Result(state: state) }
        if ok { return Result(state: cleared(state), effects: [.clearSafetyCheck]) }
        input.method = .safetyCheckEscalation; input.userConfirmed = true
        let started = startSos(state, input, now, trail: state.trail)
        return Result(state: started.state, effects: [.clearSafetyCheck] + started.effects)
    }

    private static func tick(_ state: IncidentState, _ now: Millis) -> Result {
        if state.phase == .safetyCheckRequested, let current = state.check, var input = state.input, now >= current.deadlineMillis {
            // No answer to a quiet check: ask once more, urgently. No answer to an urgent one: raise the SOS for her.
            if !current.urgent {
                var next = state
                next.check = check(urgent: true, now, repeated: true)
                return Result(state: next, effects: [.askSafetyCheck(urgent: true)])
            }
            input.method = .safetyCheckEscalation; input.userConfirmed = false
            let started = startSos(state, input, now, trail: state.trail)
            return Result(state: started.state, effects: [.clearSafetyCheck] + started.effects)
        }
        // SOS running but no new GPS fix (indoors, say): still send her last known place every 5 minutes.
        if state.phase == .sosActive, state.alertSent, let last = state.lastFix,
           case .send(let held) = UpdateThrottle.decide(lastSentFix: state.lastSentFix, lastSentAtMillis: state.lastSentAtMillis, fix: last, nowMillis: now, canSend: state.canSend, pointsHeld: state.pointsHeld) {
            return sendUpdate(state, last, held, now)
        }
        return Result(state: state)
    }

    private static func location(_ state: IncidentState, _ fix: LocationFix, _ now: Millis) -> Result {
        if state.phase == .inactive || state.phase == .resolved { return Result(state: state) } // location is only kept during a session
        var next = state
        next.trail = Array((state.trail + [fix]).suffix(IncidentState.trailMax))
        if next.phase != .sosActive || !next.alertSent { return Result(state: next) }
        switch UpdateThrottle.decide(lastSentFix: next.lastSentFix, lastSentAtMillis: next.lastSentAtMillis, fix: fix, nowMillis: now, canSend: next.canSend, pointsHeld: next.pointsHeld) {
        case .send(let held): return sendUpdate(next, fix, held, now)
        case .hold: next.pointsHeld += 1; return Result(state: next)
        case .nothing: return Result(state: next)
        }
    }

    private static func sendUpdate(_ state: IncidentState, _ fix: LocationFix, _ held: Int, _ now: Millis) -> Result {
        var next = state
        next.lastSentFix = fix; next.lastSentAtMillis = now; next.pointsHeld = 0
        return Result(state: next, effects: [.sendUpdate(fix: fix, pointsHeld: held)])
    }
}

extension String {
    // True for "" and for text that is only spaces or line breaks (Kotlin's isBlank).
    var isBlank: Bool { allSatisfy(\.isWhitespace) }
}
