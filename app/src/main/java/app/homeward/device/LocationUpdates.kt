package app.homeward.device

import android.annotation.SuppressLint
import android.content.Context
import android.location.LocationListener
import android.location.LocationManager
import android.os.Looper
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

// A live stream of your position while the app is open, straight from GPS (works with no signal).
// Every 5 s or 10 m, whichever comes first. Stops by itself when the screen stops listening.
class LocationUpdates(private val context: Context) {

    @SuppressLint("MissingPermission") // asked in MainActivity
    fun stream(): Flow<GeoPoint> = callbackFlow {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val listener = LocationListener { trySend(GeoPoint(it.latitude, it.longitude)) }
        runCatching { lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 5_000L, 10f, listener, Looper.getMainLooper()) }
        awaitClose { lm.removeUpdates(listener) }
    }
}
