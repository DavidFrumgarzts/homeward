package app.beacon.features.safetypack

import kotlinx.serialization.Serializable

// Everything the app needs to keep you safe in one city, saved on the phone so it works offline.
// Built in the cloud when you land (SafetyPackBuilder), read offline everywhere else.
@Serializable
data class SafetyPack(
    val city: String,                 // "Rio de Janeiro"
    val country: String,              // "Brazil"
    val police: String,               // "190"
    val ambulance: String,            // "192"
    val embassyName: String,          // "U.S. Consulate General Rio de Janeiro"
    val embassyPhone: String,
    val localPhrases: List<Phrase>,   // "Help!" -> "Socorro!"
    val safePlaces: List<SafePlace>,
    val zones: List<SafetyZone>,
    val builtAtMillis: Long,
)

@Serializable
data class Phrase(val english: String, val local: String)

// A place to run to: 24h gas station, hospital, police post, big hotel.
@Serializable
data class SafePlace(
    val name: String,
    val kind: String,          // "gas station", "police", "hospital", "hotel"
    val lat: Double,
    val lng: Double,
    val open24h: Boolean,
    val opensHour: Int = 0,    // used when not open 24h (local time, 0-23)
    val closesHour: Int = 24,
    val note: String = "",     // "main road, well lit"
)

// A colored area on the safety map. Zones describe PLACES and TIMES, never people.
@Serializable
data class SafetyZone(
    val name: String,                  // "Rua dos Inválidos"
    val level: ZoneLevel,
    val polygon: List<List<Double>>,   // [[lat, lng], ...]
    val riskyFromHour: Int = 0,        // e.g. 23 -> risky after 11pm
    val riskyToHour: Int = 24,         // e.g. 5  -> until 5am
    val reasons: List<String>,         // short, sourced reasons shown to the user
)

@Serializable
enum class ZoneLevel { Safer, Careful, Avoid }
