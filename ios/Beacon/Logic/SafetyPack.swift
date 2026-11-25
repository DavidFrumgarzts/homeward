import Foundation

// Everything Beacon needs to keep you safe in one city, saved on the phone so it works offline.
// Same shape as shared/schema/safety-pack.schema.json and Android's SafetyPack. Unknown fields are
// ignored and missing optional ones take their default, so a newer pack still loads.
struct SafetyPack: Codable, Equatable, Sendable {
    var city: String
    var country: String
    var police: String
    var ambulance: String
    var embassyName: String
    var embassyPhone: String
    var localPhrases: [Phrase]
    var safePlaces: [SafePlace]
    var zones: [SafetyZone]
    var builtAtMillis: Double = 0
    var placesFromOsm: Bool = false
}

struct Phrase: Codable, Equatable, Sendable {
    var english: String
    var local: String
}

// A place to go for help: police station, hospital, pharmacy, 24h petrol station.
struct SafePlace: Codable, Equatable, Sendable {
    var name: String
    var kind: String            // "police", "hospital", "pharmacy", "gas station", "hotel"
    var lat: Double
    var lng: Double
    var open24h: Bool
    var opensHour: Int = 0      // used when not open 24h (local time, 0-23)
    var closesHour: Int = 24
    var note: String = ""

    var point: GeoPoint { GeoPoint(lat: lat, lng: lng) }
}

enum ZoneLevel: String, Codable, Sendable { case safer = "Safer", careful = "Careful", avoid = "Avoid" }

// A coloured area on the map. Zones describe PLACES and TIMES, never people.
struct SafetyZone: Codable, Equatable, Sendable {
    var name: String
    var level: ZoneLevel
    var polygon: [[Double]]     // [[lat, lng], ...]
    var riskyFromHour: Int = 0  // e.g. 23 -> risky after 11pm
    var riskyToHour: Int = 24   // e.g. 5  -> until 5am
    var reasons: [String]
}

// Decoding by hand only so missing optional fields fall back to their defaults.
extension SafetyPack {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        city = try c.decode(String.self, forKey: .city)
        country = try c.decode(String.self, forKey: .country)
        police = try c.decode(String.self, forKey: .police)
        ambulance = try c.decode(String.self, forKey: .ambulance)
        embassyName = try c.decodeIfPresent(String.self, forKey: .embassyName) ?? ""
        embassyPhone = try c.decodeIfPresent(String.self, forKey: .embassyPhone) ?? ""
        localPhrases = try c.decodeIfPresent([Phrase].self, forKey: .localPhrases) ?? []
        safePlaces = try c.decodeIfPresent([SafePlace].self, forKey: .safePlaces) ?? []
        zones = try c.decodeIfPresent([SafetyZone].self, forKey: .zones) ?? []
        builtAtMillis = try c.decodeIfPresent(Double.self, forKey: .builtAtMillis) ?? 0
        placesFromOsm = try c.decodeIfPresent(Bool.self, forKey: .placesFromOsm) ?? false
    }
}

extension SafePlace {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        name = try c.decode(String.self, forKey: .name)
        kind = try c.decode(String.self, forKey: .kind)
        lat = try c.decode(Double.self, forKey: .lat)
        lng = try c.decode(Double.self, forKey: .lng)
        open24h = try c.decodeIfPresent(Bool.self, forKey: .open24h) ?? false
        opensHour = try c.decodeIfPresent(Int.self, forKey: .opensHour) ?? 0
        closesHour = try c.decodeIfPresent(Int.self, forKey: .closesHour) ?? 24
        note = try c.decodeIfPresent(String.self, forKey: .note) ?? ""
    }
}

extension SafetyZone {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        name = try c.decode(String.self, forKey: .name)
        level = try c.decode(ZoneLevel.self, forKey: .level)
        polygon = try c.decode([[Double]].self, forKey: .polygon)
        riskyFromHour = try c.decodeIfPresent(Int.self, forKey: .riskyFromHour) ?? 0
        riskyToHour = try c.decodeIfPresent(Int.self, forKey: .riskyToHour) ?? 24
        reasons = try c.decodeIfPresent([String].self, forKey: .reasons) ?? []
    }
}
