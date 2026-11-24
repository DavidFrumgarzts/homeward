package app.homeward.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import android.net.Uri
import androidx.navigation.NavType
import androidx.navigation.navArgument
import app.homeward.features.ask.AskBeaconScreen
import app.homeward.features.contacts.ContactsScreen
import app.homeward.features.home.HomeScreen
import app.homeward.features.onboarding.OnboardingFlow
import app.homeward.app.AppServices
import app.homeward.features.sos.SosComposeScreen
import app.homeward.features.sos.SosSentScreen
import app.homeward.features.sos.SosViewModel

// Connects screens together: which button goes where. The SOS screens share one SosViewModel.
@Composable
fun AppNavGraph() {
    val nav = rememberNavController()
    val sos: SosViewModel = viewModel()

    // First launch starts with onboarding; after that, straight to Home.
    val start = if (AppServices.onboarding.isDone()) Screen.Home.route else Screen.Onboarding.route
    NavHost(nav, startDestination = start) {
        composable(Screen.Onboarding.route) {
            OnboardingFlow(onFinished = { nav.navigate(Screen.Home.route) { popUpTo(Screen.Onboarding.route) { inclusive = true } } })
        }
        composable(Screen.Home.route) {
            HomeScreen(
                onSos = { nav.navigate(Screen.SosCompose.route) },
                onEditContacts = { nav.navigate(Screen.Contacts.route) },
                onAsk = { question -> nav.navigate("${Screen.Ask.route}?q=${Uri.encode(question)}") },
            )
        }
        composable(Screen.SosCompose.route) {
            SosComposeScreen(sos, onBack = { nav.popBackStack() }, onSent = { nav.navigate(Screen.SosSent.route) })
        }
        composable(Screen.SosSent.route) { SosSentScreen(sos) }
        composable(Screen.Contacts.route) { ContactsScreen(onBack = { nav.popBackStack() }) }
        composable("${Screen.Ask.route}?q={q}", arguments = listOf(navArgument("q") { type = NavType.StringType; defaultValue = "" })) { entry ->
            AskBeaconScreen(firstQuestion = entry.arguments?.getString("q").orEmpty(), onBack = { nav.popBackStack() })
        }
    }
}
