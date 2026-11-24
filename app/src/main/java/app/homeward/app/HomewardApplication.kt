package app.homeward.app

import android.app.Application
import com.google.firebase.FirebaseApp
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory
import org.osmdroid.config.Configuration

// Runs once when the app process starts: Firebase, App Check (required), map setup, shared services.
class HomewardApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
        // Debug App Check provider: allowed by the hackathon rules. Register the debug token
        // printed in Logcat in Firebase console > App Check.
        FirebaseAppCheck.getInstance().installAppCheckProviderFactory(DebugAppCheckProviderFactory.getInstance())
        // OpenStreetMap requires an identifying user agent.
        Configuration.getInstance().userAgentValue = packageName
        AppServices.init(this)
    }
}
