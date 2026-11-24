package app.homeward.device

import android.annotation.SuppressLint
import android.content.Context
import android.location.LocationManager

// Gets the phone's current position. Uses GPS directly, which works with NO signal
// (satellites, not cell towers). Returns null if location permission is missing or no fix yet.
class LocationReader(private val context: Context) {

    @SuppressLint("MissingPermission") // permission is requested in MainActivity
    fun lastKnown(): GeoPoint? {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val best = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            .mapNotNull { runCatching { lm.getLastKnownLocation(it) }.getOrNull() }
            .maxByOrNull { it.time }
        return best?.let { GeoPoint(it.latitude, it.longitude) }
    }
}
