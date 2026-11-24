package app.homeward.app

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import app.homeward.ai.OnDeviceModelSetup
import app.homeward.design.HomewardTheme
import app.homeward.features.safetypack.PackUpdater
import app.homeward.navigation.AppNavGraph
import kotlinx.coroutines.launch

// The app's only Activity. Asks for permissions, starts the on-device model download, shows the screens.
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Location (for SOS + zone warnings) and SMS (offline SOS). Asked once on first launch.
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {}
            .launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.SEND_SMS))

        // Download Gemini Nano now, while there is wifi, so SOS works offline later.
        lifecycleScope.launch { OnDeviceModelSetup.ensureDownloaded { } }

        // Just landed and online? Build the safety pack for this city in the cloud and save it.
        lifecycleScope.launch { PackUpdater.updateIfNeeded(this@MainActivity) }

        setContent { HomewardTheme { AppNavGraph() } }
    }
}
