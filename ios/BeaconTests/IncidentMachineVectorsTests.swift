import XCTest
@testable import Beacon

// Runs shared/test-vectors/incident-machine.json: each case starts Inactive, feeds events in order,
// and compares a snapshot of the state and the effects after every step with Android's.
final class IncidentMachineVectorsTests: XCTestCase {
    func testIncidentMachine() {
        let ran = Vectors.run("incident-machine.json") { _, input in
            var state = IncidentState()
            return .array(try input["steps"].items.map { step in
                let result = IncidentReducer.reduce(state, try self.event(step["event"]), now: step["now"].millis)
                state = result.state
                return self.snapshot(state, result.effects)
            })
        }
        XCTAssertGreaterThan(ran, 0)
    }

    private func event(_ e: J) throws -> IncidentEvent {
        switch e["type"].string {
        case "StartSos": return .startSos(try e["input"].decode())
        case "RaiseSafetyCheck": return .raiseSafetyCheck(try e["input"].decode(), urgent: e["urgent"].bool)
        case "AnswerSafetyCheck": return .answerSafetyCheck(ok: e["ok"].bool)
        case "Tick": return .tick
        case "Describe": return .describe(text: e["text"].string ?? "", plainMessage: e["plainMessage"].string ?? "")
        case "MessageWritten": return .messageWritten(forDescription: e["forDescription"].string ?? "", message: e["message"].string ?? "", ranOnDevice: e["ranOnDevice"].isNull ? nil : e["ranOnDevice"].bool)
        case "EditMessage": return .editMessage(e["text"].string ?? "")
        case "Send": return .send(message: e["message"].string ?? "")
        case "Delivery": return .delivery(try e["delivery"].decode())
        case "UpdateConfirmed": return .updateConfirmed(atMillis: e["atMillis"].millis)
        case "Location": return .location(try e["fix"].decode())
        case "Signal": return .signal(canSend: e["canSend"].bool)
        case "Battery": return .battery(percent: e["percent"].int)
        case "ImOk": return .imOk
        case "Cancel": return .cancel
        case "Reset": return .reset
        default: throw Vectors.UnknownFunction(fn: e["type"].string ?? "?")
        }
    }

    private func snapshot(_ s: IncidentState, _ effects: [IncidentEffect]) -> J {
        .object([
            "phase": .string(s.phase.rawValue),
            "effects": .array(effects.map(effect)),
            "method": .text(s.input?.method.rawValue),
            "userConfirmed": .flag(s.input?.userConfirmed),
            "description": .string(s.description),
            "situation": .string(s.situation.key),
            "message": .string(s.message),
            "messageRanOnDevice": .flag(s.messageRanOnDevice),
            "writing": .bool(s.writing),
            "alertSent": .bool(s.alertSent),
            "deliveries": .array(s.deliveries.map { .string("\($0.contactName):\($0.status.rawValue)") }),
            "trail": .number(Double(s.trail.count)),
            "pointsHeld": .number(Double(s.pointsHeld)),
            "canSend": .bool(s.canSend),
            "lastSentAtMillis": .num(s.lastSentAtMillis),
            "lastUpdateConfirmedAtMillis": .num(s.lastUpdateConfirmedAtMillis),
            "batteryLowSent": .bool(s.batteryLowSent),
            "check": s.check.map { .object(["urgent": .bool($0.urgent), "deadlineMillis": .num($0.deadlineMillis), "repeated": .bool($0.repeated)]) } ?? .null,
            "endedAtMillis": .num(s.endedAtMillis),
        ])
    }

    private func effect(_ e: IncidentEffect) -> J {
        switch e {
        case .startSession: return .object(["type": .string("StartSession")])
        case .stopSession: return .object(["type": .string("StopSession")])
        case .writeMessage(let description): return .object(["type": .string("WriteMessage"), "description": .string(description)])
        case .sendAlert(let message): return .object(["type": .string("SendAlert"), "message": .string(message)])
        case .sendAutoAlert: return .object(["type": .string("SendAutoAlert")])
        case .sendUpdate(let fix, let held): return .object(["type": .string("SendUpdate"), "pointsHeld": .number(Double(held)), "takenAtMillis": .num(fix.takenAtMillis)])
        case .sendBatteryLow(let fix): return .object(["type": .string("SendBatteryLow"), "hasFix": .bool(fix != nil)])
        case .sendEnded: return .object(["type": .string("SendEnded")])
        case .flushOutbox: return .object(["type": .string("FlushOutbox")])
        case .askSafetyCheck(let urgent): return .object(["type": .string("AskSafetyCheck"), "urgent": .bool(urgent)])
        case .clearSafetyCheck: return .object(["type": .string("ClearSafetyCheck")])
        }
    }
}
