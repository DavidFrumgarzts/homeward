package app.homeward.features.incident.contracts

import app.homeward.device.GeoPoint
import kotlinx.serialization.Serializable

// One GPS reading: where, when it was taken, and how exact. The time matters as much as the place:
// the UI and every message say how old a fix is, and a missing fix stays missing (never invented).
@Serializable
data class LocationFix(val point: GeoPoint, val takenAtMillis: Long, val accuracyMeters: Float? = null)
