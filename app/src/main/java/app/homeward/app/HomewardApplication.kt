package app.homeward.app

import android.app.Application
import app.homeward.device.ConnectivityWatcher
import app.homeward.features.offlinemap.OfflineMapSaver
import com.google.firebase.FirebaseApp
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory
import org.osmdroid.config.Configuration
import java.io.File

// Runs once when the app process starts: Firebase, App Check (required), map setup, shared services.
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
        // Back online? Send safety photos that were saved while there was no signal.
        ConnectivityWatcher(this).start { Thread { AppServices.outboxSender.flush() }.start() }
    }
}
