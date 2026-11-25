import Foundation

// Carries out what the reducer asked for: start reading location, write the message, open Messages,
// save to Firestore. The reducer decides WHAT happens; this file only does it. All wording comes
// from IncidentMessages. (The iOS twin of Android's IncidentEffects.kt.)
//
// The two iOS paths: the text goes through Messages (she presses send; an app cannot send a text by
// itself on an iPhone), and the incident plus its location updates go to Firestore for the family link.
extension IncidentEngine {
    static let writePauseNanos: UInt64 = 900_000_000

    // The whole alert for a sentence: the sentence, then location, link and what to do, added by code.
    func composeAlert(_ sentence: String) -> String {
        self.sentence = sentence
        let fix = state.lastFix ?? location.lastFix
        return IncidentMessages.alert(profile: store.profile, sentence: sentence, fix: fix, fixTime: fix.map { Clock.timeText($0.takenAtMillis) },
                                      police: packs.pack.police, familyLink: sync.familyLink)
    }

    func composeLatest() -> String {
        composeAlert(sentence.isBlank ? IncidentMessages.plainSentence(profile: store.profile, description: state.description) : sentence)
    }

    func run(_ effect: IncidentEffect, _ state: IncidentState) {
        guard let id = state.input?.sessionId else { return }
        let profile = store.profile
        switch effect {
        case .startSession:
            location.start(for: "sos")
        case .stopSession:
            writing?.cancel()
            location.stop(for: "sos")
        case .writeMessage(let description):
            // Wait for a pause in her typing, then ask the model once.
            writing?.cancel()
            writing = Task { [weak self, writer] in
                try? await Task.sleep(nanoseconds: Self.writePauseNanos)
                if Task.isCancelled { return }
                let written = await writer.write(profile: profile, note: description)
                guard let self, !Task.isCancelled, self.state.description == description else { return } // she has typed something else since
                self.dispatch(.messageWritten(forDescription: description, message: self.composeAlert(written.text), ranOnDevice: written.ranOnDevice))
            }
        case .sendAlert(let message):
            saveStart(state, profile)
            openMessages(.alert, body: message)
        case .sendAutoAlert:
            let fix = state.lastFix
            let text = IncidentMessages.autoAlert(profile: profile, checkTime: Clock.timeText(Clock.nowMillis), fix: fix, fixTime: fix.map { Clock.timeText($0.takenAtMillis) },
                                                  reasons: state.input?.triggerReasons ?? [], police: packs.pack.police, familyLink: sync.familyLink)
            dispatch(.messageWritten(forDescription: state.description, message: text, ranOnDevice: nil)) // so the screen shows what was sent
            saveStart(self.state, profile)
            openMessages(.alert, body: text)
        case .sendUpdate(let fix, let held):
            sync.addUpdate(incidentId: id, kind: "update", fix: fix, battery: batteryPercent(), pointsHeld: held, onConfirmed: { [weak self] in
                self?.dispatch(.updateConfirmed(atMillis: Clock.nowMillis))
            })
        case .sendBatteryLow(let fix):
            sync.addUpdate(incidentId: id, kind: "batteryLow", fix: fix, battery: batteryPercent(), pointsHeld: 0, onConfirmed: nil)
        case .sendEnded:
            if let record = IncidentRecord(state: state, profile: profile, pack: packs.pack, now: Clock.nowMillis) { sync.saveIncident(record) }
            sync.addUpdate(incidentId: id, kind: "ended", fix: state.lastFix, battery: batteryPercent(), pointsHeld: 0, onConfirmed: nil)
            let text = IncidentMessages.ended(profile: profile, time: Clock.timeText(Clock.nowMillis))
            endedText = text
            openMessages(.ended, body: text)
        case .flushOutbox:
            sync.retry()
        case .askSafetyCheck, .clearSafetyCheck:
            break // safety checks come to iOS in a later phase (time-sensitive notifications)
        }
    }

    // Messages finished: record what really happened. "Sent" means she pressed send, nothing more.
    func composeFinished(_ request: ComposeRequest, _ outcome: ComposeOutcome) {
        compose = nil
        guard request.kind == .alert else { return }
        switch outcome {
        case .sent:
            messages = .sent
            store.contacts.forEach { dispatch(.delivery(ContactDelivery(contactName: $0.name, channel: .sms, status: .sent, updatedAtMillis: Clock.nowMillis))) }
        case .cancelled: messages = .cancelled
        case .failed: messages = .failed
        }
    }

    // "Open Messages again" after she closed it without sending (the alert, or the "it's over" text).
    func reopenMessages() {
        if state.phase == .resolved, let endedText { openMessages(.ended, body: endedText) } else { openMessages(.alert, body: state.message) }
    }

    private func saveStart(_ state: IncidentState, _ profile: UserProfile) {
        guard let record = IncidentRecord(state: state, profile: profile, pack: packs.pack, now: Clock.nowMillis) else { return }
        sync.startIncident(record, fix: state.lastSentFix, battery: batteryPercent())
    }

    private func openMessages(_ kind: ComposeRequest.Kind, body: String) {
        let phones = store.contacts.map(\.phone)
        if kind == .alert {
            messages = phones.isEmpty ? .notOpened : testMode ? .testMode : canSendText() ? .composing : .unavailable
        }
        guard !phones.isEmpty, !testMode, canSendText() else { return }
        compose = ComposeRequest(kind: kind, recipients: phones, body: body)
    }
}
