package app.homeward.device

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
import app.homeward.features.incident.contracts.LocationFix

// Gets the phone's last known position. Uses GPS directly, which works with NO signal
// (satellites, not cell towers). Returns null if location permission is missing or there is no fix yet.
class LocationReader(private val context: Context) {

    // Where, plus when the fix was taken and how exact it is. Messages always say how old a fix is.
    @SuppressLint("MissingPermission") // permission is requested in onboarding
    fun lastFix(): LocationFix? {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            .mapNotNull { runCatching { lm.getLastKnownLocation(it) }.getOrNull() }
            .maxByOrNull { it.time }?.toFix()
    }

    fun lastKnown(): GeoPoint? = lastFix()?.point
}

fun Location.toFix() = LocationFix(GeoPoint(latitude, longitude), time, if (hasAccuracy()) accuracy else null)
