package app.homeward.app

import android.app.Application
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import app.homeward.device.ConnectivityWatcher
import app.homeward.features.offlinemap.OfflineMapSaver
import app.homeward.features.sos.sending.SmsStatusReceiver
import com.google.firebase.FirebaseApp
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory
import org.osmdroid.config.Configuration
import java.io.File

// Runs once when the app process starts: Firebase, App Check (required), map setup, shared services,
// and the listeners that send queued messages when the phone can reach the network again.
class HomewardApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
        // Debug App Check provider: allowed by the hackathon rules. Register the debug token
        // printed in Logcat in Firebase console > App Check.
        FirebaseAppCheck.getInstance().installAppCheckProviderFactory(DebugAppCheckProviderFactory.getInstance())
        // Map setup: identify ourselves to the tile server, and keep map tiles (including the saved
        // offline city) in the app's own storage. Newer Android blocks osmdroid's default folder,
        // which left the map grey.
        Configuration.getInstance().apply {
            userAgentValue = packageName
            osmdroidBasePath = File(filesDir, "osmdroid")
            osmdroidTileCache = File(osmdroidBasePath, "tiles")
        }
        AppServices.init(this)
        OfflineMapSaver.deleteIfTooOld(this) // map provider rule: max 30 days on the phone
        SmsStatusReceiver.register(this)     // hears from the radio whether each SOS text was sent and delivered
        AppServices.sosOutbox.prune(System.currentTimeMillis())
        AppServices.incidentSync.signIn()    // anonymous; needed once, while online, so an SOS can carry a family link

        // Back in reach? Send what was saved while there was no signal: SOS texts first, then safety photos.
        val sendWaiting = { AppServices.incidentSync.signIn(); Thread { AppServices.sosDispatcher.flush(); AppServices.outboxSender.flush() }.start() }
        ConnectivityWatcher(this).start { sendWaiting() }
        // SMS needs cell signal, not data, so also try when airplane mode is switched off.
        registerReceiver(object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) { if (!intent.getBooleanExtra("state", false)) sendWaiting() }
        }, IntentFilter(Intent.ACTION_AIRPLANE_MODE_CHANGED))
    }
}
