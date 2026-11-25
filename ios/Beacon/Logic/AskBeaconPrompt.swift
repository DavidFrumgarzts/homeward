import Foundation

// PURE LOGIC: builds the prompt for Ask Beacon. The on-device model is small and can't search, so we
// hand it every fact it may use: the saved numbers, phrases, red zones and the closest open places.
// It only rewrites those into an answer. Same facts and wording as Android's AskBeaconPrompt.kt.
enum AskBeaconPrompt {
    // `earlier` is the last few question/answer pairs of this chat, oldest first, so a follow-up like
    // "how far is it?" makes sense. Each request is single-turn; the model has no memory of its own.
    static func build(question: String, pack: SafetyPack, here: GeoPoint?, hour: Int, earlier: [(q: String, a: String)] = []) -> String {
        let zones = pack.zones.filter { $0.level != .safer }.map { zone -> String in
            let away = here.map { "\(Int(ZoneChecker.distanceToZone($0, zone))) m from you. " } ?? ""
            let now = ZoneChecker.isRisky(zone, hour: hour) ? "risky right now" : "fine at this hour"
            return "- \(zone.name): \(away)Avoid from \(NearbyFeed.clock(zone.riskyFromHour)) to \(NearbyFeed.clock(zone.riskyToHour)) (\(now)). \(zone.reasons.first ?? "")"
        }.joined(separator: "\n")
        let safer = pack.zones.filter { $0.level == .safer }.map(\.name).joined(separator: ", ")
        let places = pack.safePlaces
            .filter { SafePlacePicker.isOpen($0, hour: hour) }
            .map { place in (place, here.map { Int($0.meters(to: place.point)) }) }
            .sorted { ($0.1 ?? Int.max) < ($1.1 ?? Int.max) }
            .prefix(5)
            .map { place, meters in "- \(place.name) (\(place.kind))\(meters.map { ", \($0) m away" } ?? ""), \(place.open24h ? "open 24h" : "open now")" }
            .joined(separator: "\n")
        let phrases = pack.localPhrases.prefix(6).map { "- \($0.english) = \($0.local)" }.joined(separator: "\n")
        let chat = earlier.suffix(2).map { "Traveler: \($0.q)\nBeacon: \($0.a)" }.joined(separator: "\n")

        return """
        You are Beacon, a calm safety helper for a traveler in \(pack.city), \(pack.country). It is \(NearbyFeed.clock(hour)).
        Answer the question using ONLY the facts below. Copy phone numbers and names exactly.
        If asked whether the area is OK, use the distances and hours under "Streets to avoid", and name a safer street or place.
        If the facts don't cover it, say "I don't have that saved. Police: \(pack.police)."
        Write at most 3 short steps, plain words, no headings.

        FACTS
        Police: \(pack.police). Ambulance: \(pack.ambulance). Embassy: \(pack.embassyName), \(pack.embassyPhone).
        Streets to avoid:
        \(zones)
        Busier, safer streets: \(safer)
        Closest open places to get help:
        \(places)
        Local phrases:
        \(phrases)

        EARLIER IN THIS CHAT
        \(chat.isEmpty ? "(nothing yet)" : chat)

        QUESTION: \(question)
        """
    }

    // Used when nothing else can answer: the facts that matter most, with no AI involved.
    static func fallback(_ pack: SafetyPack) -> String {
        "I couldn't work that out right now. Police: \(pack.police). Ambulance: \(pack.ambulance). \(pack.embassyName): \(pack.embassyPhone)."
    }
}
