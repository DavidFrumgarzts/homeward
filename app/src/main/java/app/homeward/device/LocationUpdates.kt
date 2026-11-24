package app.homeward.device

import android.annotation.SuppressLint
import android.content.Context
import android.location.LocationListener
import android.location.LocationManager
import android.os.Looper
import app.homeward.features.incident.contracts.LocationFix
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.map

// A live stream of your position, straight from GPS (works with no signal).
// Stops by itself when nobody is listening any more.
class LocationUpdates(private val context: Context) {

    // For the Home map while it is open: every 5 s or 10 m, whichever comes first.
    fun stream(): Flow<GeoPoint> = fixes(5_000L, 10f).map { it.point }

    // For a safety session: fixes with their time and accuracy, at the pace the session asks for.
    @SuppressLint("MissingPermission") // asked in onboarding
    fun fixes(everyMillis: Long, minMeters: Float): Flow<LocationFix> = callbackFlow {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val listener = LocationListener { trySend(it.toFix()) }
        runCatching { lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, everyMillis, minMeters, listener, Looper.getMainLooper()) }
        awaitClose { lm.removeUpdates(listener) }
    }
}
