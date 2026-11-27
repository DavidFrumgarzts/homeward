package app.homeward.features.session

import android.Manifest
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import app.homeward.app.AppServices
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

// The foreground service that keeps a safety session alive when the screen is off or the app is closed.
// While it runs it reads GPS and hands every fix to the IncidentEngine; when it stops, GPS stops.
// Location is read ONLY while this service runs, and it only runs for an SOS (or, later, a Safe Walk)
// that she started. It must be started from a visible screen (Android rule for foreground services).
// The microphone type and the notification's "I'm OK" / "SOS" actions arrive with Safe Walk.
class SafetySessionService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var tracking: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION else 0
        runCatching { ServiceCompat.startForeground(this, SessionNotification.ID, SessionNotification.build(this), type) }
            .onFailure { Log.w(TAG, "Could not start in the foreground: ${it.message}"); stopSelf(); return START_NOT_STICKY }
        if (tracking?.isActive != true) {
            tracking = scope.launch { AppServices.locationUpdates.fixes(SOS_EVERY_MILLIS, 0f).collect { AppServices.incident.onLocation(it) } }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        scope.cancel() // stops GPS
        super.onDestroy()
    }

    companion object {
        private const val TAG = "SafetySessionService"
        const val SOS_EVERY_MILLIS = 5_000L // during an SOS: a fix every 5 seconds

        // Without location permission there is nothing for the service to do (and Android would refuse to start it).
        fun start(context: Context) {
            val allowed = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            if (!allowed) { Log.i(TAG, "No location permission: the SOS runs without location updates"); return }
            runCatching { ContextCompat.startForegroundService(context, Intent(context, SafetySessionService::class.java)) }
                .onFailure { Log.w(TAG, "Session not started: ${it.message}") }
        }

        fun stop(context: Context) { context.stopService(Intent(context, SafetySessionService::class.java)) }
    }
}
