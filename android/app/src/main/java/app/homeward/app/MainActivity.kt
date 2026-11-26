package app.homeward.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import app.homeward.ai.OnDeviceModelSetup
import app.homeward.design.HomewardTheme
import app.homeward.features.safetypack.PackUpdater
import app.homeward.navigation.AppNavGraph
import kotlinx.coroutines.launch

// The app's only Activity. Starts the on-device model download and pack update (returning users;
// first launch does this in onboarding), then shows the screens. Permissions are asked in onboarding step 3.
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (AppServices.onboarding.isDone()) {
            // Download Gemini Nano now, while there is wifi, so SOS works offline later.
            lifecycleScope.launch { OnDeviceModelSetup.ensureDownloaded { } }
            // Just landed and online? Build the safety pack for this city in the cloud and save it.
            lifecycleScope.launch { PackUpdater.updateIfNeeded(this@MainActivity) }
        }

        setContent { HomewardTheme { AppNavGraph() } }
    }
}
