package app.beacon.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import app.beacon.features.home.HomeScreen
import app.beacon.features.sos.SosComposeScreen
import app.beacon.features.sos.SosSentScreen
import app.beacon.features.sos.SosViewModel

// Connects screens together: which button goes where. The SOS screens share one SosViewModel.
@Composable
fun AppNavGraph() {
    val nav = rememberNavController()
    val sos: SosViewModel = viewModel()

    NavHost(nav, startDestination = Screen.Home.route) {
        composable(Screen.Home.route) {
            HomeScreen(onSos = { nav.navigate(Screen.SosCompose.route) })
        }
        composable(Screen.SosCompose.route) {
            SosComposeScreen(sos, onBack = { nav.popBackStack() }, onSent = { nav.navigate(Screen.SosSent.route) })
        }
        composable(Screen.SosSent.route) { SosSentScreen(sos) }
    }
}
