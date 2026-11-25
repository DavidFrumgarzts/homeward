import Foundation

// PURE LOGIC, no AI: answers the common questions straight from the saved pack by looking for key
// words. This is what Ask Beacon says when no AI can run (no Apple Intelligence and no signal),
// so the chat is never empty-handed. Numbers and names are copied from the pack, never made up.
// Same idea and wording as plainAnswer() in web/js/ask.js. Tested in AskBeaconRulesTests.
enum AskBeaconRules {
    static func answer(question: String, pack: SafetyPack, here: GeoPoint?, hour: Int) -> String {
        let q = question.lowercased()
        let said = q.split { !$0.isLetter }.map(String.init)
        // A phrase must appear as written. A long word may be the start of hers ("danger" in "dangerous");
        // a short one must be the whole word, so "ok" is not found inside "joke".
        func has(_ keys: String...) -> Bool {
            keys.contains { key in key.contains(" ") ? q.contains(key) : said.contains { key.count >= 4 ? $0.hasPrefix(key) : $0 == key } }
        }
        let place = here.flatMap { SafePlacePicker.pick(here: $0, places: pack.safePlaces, hour: hour) }
        let avoid = pack.zones.first { $0.level == .avoid }
        let safer = pack.zones.first { $0.level == .safer }?.name

        if has("ambulance", "hospital", "hurt", "doctor") {
            let hospital = pack.safePlaces.first { $0.kind.lowercased() == "hospital" }
            return "Ambulance: \(pack.ambulance)." + (hospital.map { " The nearest hospital saved is \($0.name)\($0.open24h ? ", open 24 hours" : "")." } ?? "")
        }
        if has("embassy", "consulate", "passport") { return "\(pack.embassyName): \(pack.embassyPhone)." }
        if has("police", "number", "emergency") { return "Police: \(pack.police). Ambulance: \(pack.ambulance)." }
        if has("safe place", "get help", "where", "go", "open", "far") {
            guard let place else { return "I don't know where you are yet. Police: \(pack.police)." }
            return "\(place.place.name) is \(NearbyFeed.distance(place.meters)) away and \(place.place.open24h ? "open 24 hours" : "open now")." + (safer.map { " Stay on \($0) to get there." } ?? "")
        }
        if has("ok", "area", "safe", "zone", "danger", "risky"), let avoid {
            let hours = "Avoid it from \(NearbyFeed.clock(avoid.riskyFromHour)) to \(NearbyFeed.clock(avoid.riskyToHour))"
            let now = ZoneChecker.isRisky(avoid, hour: hour) ? ", which is now" : "; it's fine at this hour"
            let near = here.map { p -> String in
                let m = Int(ZoneChecker.distanceToZone(p, avoid))
                return m == 0 ? "You are on \(avoid.name). " : "\(avoid.name) is \(NearbyFeed.distance(m)) from you. "
            } ?? ""
            return "\(near)\(hours)\(now)." + (safer.map { " \($0) stays busy." } ?? "")
        }
        if has("say", "phrase", "portuguese", "language", "help") {
            return pack.localPhrases.map { "\($0.english) = \($0.local)" }.joined(separator: "\n")
        }
        return "I don't have that saved. Police: \(pack.police)."
    }
}
