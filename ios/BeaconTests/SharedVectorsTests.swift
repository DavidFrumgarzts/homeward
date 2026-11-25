import XCTest
@testable import Beacon

// Runs eight of the nine shared vector files through the Swift ports (the state machine has its own
// file, IncidentMachineVectorsTests). Each case must give the same answer as Android's Kotlin.
final class SharedVectorsTests: XCTestCase {
    func testZones() {
        Vectors.run("zones.json") { fn, i in
            switch fn {
            case "isInside": return .bool(ZoneChecker.isInside(try i["point"].decode(), polygon: try i["polygon"].decode()))
            case "isRiskyAt": return .bool(ZoneChecker.isRisky(self.zone(from: i["riskyFromHour"].int, to: i["riskyToHour"].int), hour: i["hour"].int))
            case "distanceToZone":
                var zone = self.zone(from: 0, to: 24)
                zone.polygon = try i["polygon"].decode()
                return .number(ZoneChecker.distanceToZone(try i["point"].decode(), zone))
            case "redZoneAhead":
                let zone = ZoneChecker.redZoneAhead(try i["point"].decode(), zones: try i["zones"].decode(), hour: i["hour"].int, withinMeters: i["withinMeters"].double)
                return .text(zone?.name)
            default: throw Vectors.UnknownFunction(fn: fn)
            }
        }
    }

    func testPlacePicker() {
        Vectors.run("place-picker.json") { fn, i in
            switch fn {
            case "isOpen": return .bool(SafePlacePicker.isOpen(try i["place"].decode(), hour: i["hour"].int))
            case "pick":
                guard let pick = SafePlacePicker.pick(here: try i["here"].decode(), places: try i["places"].decode(), hour: i["hour"].int) else { return .null }
                return .object(["name": .string(pick.place.name), "meters": .number(Double(pick.meters)), "reason": .string(pick.reason)])
            default: throw Vectors.UnknownFunction(fn: fn)
            }
        }
    }

    func testApproachDetector() {
        Vectors.run("approach-detector.json") { _, i in
            let detector = ApproachDetector(warnWithinMeters: i["warnWithinMeters"].double, quietMinutes: i["quietMinutes"].millis)
            let zones: [SafetyZone] = try i["zones"].decode()
            return .array(try i["steps"].items.map { step in
                .text(detector.update(here: try step["point"].decode(), zones: zones, hour: step["hour"].int, nowMillis: step["nowMillis"].millis)?.name)
            })
        }
    }

    func testSituationAndChecklist() {
        Vectors.run("situation.json") { fn, i in
            switch fn {
            case "pick": return .string(SituationPicker.pick(i["description"].string ?? "").key)
            case "checklist": return .array(ActionChecklist.steps(for: Situation.fromKey(i["situation"].string)!).map(J.string))
            default: throw Vectors.UnknownFunction(fn: fn)
            }
        }
    }

    func testPhrasePicker() {
        Vectors.run("phrase-picker.json") { _, i in
            let phrase = PhrasePicker.pick(description: i["description"].string ?? "", situation: Situation.fromKey(i["situation"].string)!, phrases: try i["phrases"].decode())
            return phrase.map { .object(["english": .string($0.english), "local": .string($0.local)]) } ?? .null
        }
    }

    func testUpdateThrottle() {
        Vectors.run("update-throttle.json") { _, i in
            let decision = UpdateThrottle.decide(lastSentFix: try i["lastSentFix"].decodeOrNil(), lastSentAtMillis: i["lastSentAtMillis"].millis,
                                                 fix: try i["fix"].decode(), nowMillis: i["nowMillis"].millis, canSend: i["canSend"].bool, pointsHeld: i["pointsHeld"].int)
            switch decision {
            case .send(let held): return .object(["decision": .string("send"), "pointsHeld": .number(Double(held))])
            case .hold: return .object(["decision": .string("hold")])
            case .nothing: return .object(["decision": .string("nothing")])
            }
        }
    }

    func testMessageTemplates() {
        Vectors.run("message-templates.json") { fn, i in
            func profile() throws -> UserProfile { try i["profile"].decode() }
            func fix() throws -> LocationFix? { try i["fix"].decodeOrNil() }
            switch fn {
            case "short": return .string(try i["point"].decode(GeoPoint.self).short())
            case "mapsLink": return .string(MapsLink.of(try i["point"].decode()))
            case "plainSentence": return .string(IncidentMessages.plainSentence(profile: try profile(), description: i["description"].string ?? ""))
            case "alert": return .string(IncidentMessages.alert(profile: try profile(), sentence: i["sentence"].string ?? "", fix: try fix(), fixTime: i["fixTime"].string, police: i["police"].string ?? "", familyLink: i["familyLink"].string))
            case "autoAlert": return .string(IncidentMessages.autoAlert(profile: try profile(), checkTime: i["checkTime"].string ?? "", fix: try fix(), fixTime: i["fixTime"].string, reasons: try i["reasons"].decode(), police: i["police"].string ?? "", familyLink: i["familyLink"].string))
            case "update": return .string(IncidentMessages.update(profile: try profile(), fix: try i["fix"].decode(), fixTime: i["fixTime"].string ?? "", pointsHeld: i["pointsHeld"].int))
            case "batteryLow": return .string(IncidentMessages.batteryLow(profile: try profile(), fix: try fix(), fixTime: i["fixTime"].string))
            case "ended": return .string(IncidentMessages.ended(profile: try profile(), time: i["time"].string ?? ""))
            default: throw Vectors.UnknownFunction(fn: fn)
            }
        }
    }

    func testDeliveryWording() {
        Vectors.run("delivery-wording.json") { _, i in
            let summary = DeliveryWording.summarize(try i["deliveries"].decode())
            return .object(["headline": .string(summary.headline), "lines": .array(summary.lines.map(J.string)), "anyDelivered": .bool(summary.anyDelivered)])
        }
    }

    // Every file in the folder must have a port here: a new vector file fails this until it is run.
    func testEveryVectorFileIsRun() throws {
        let known: Set<String> = ["zones.json", "place-picker.json", "approach-detector.json", "situation.json", "phrase-picker.json",
                                  "update-throttle.json", "message-templates.json", "delivery-wording.json", "incident-machine.json"]
        let onDisk = Set(try FileManager.default.contentsOfDirectory(atPath: Vectors.folder.path).filter { $0.hasSuffix(".json") })
        XCTAssertEqual(onDisk, known)
    }

    private func zone(from: Int, to: Int) -> SafetyZone {
        SafetyZone(name: "z", level: .avoid, polygon: [], riskyFromHour: from, riskyToHour: to, reasons: [])
    }
}
