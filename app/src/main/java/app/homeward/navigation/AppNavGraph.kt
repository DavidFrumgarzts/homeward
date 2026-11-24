package app.homeward.navigation

import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import app.homeward.app.AppServices
import app.homeward.features.ask.AskBeaconScreen
import app.homeward.features.contacts.ContactsScreen
import app.homeward.features.home.HomeScreen
import app.homeward.features.incident.contracts.ActivationMethod
import app.homeward.features.incident.contracts.IncidentPhase
import app.homeward.features.onboarding.OnboardingFlow
import app.homeward.features.sos.SosComposeScreen
import app.homeward.features.sos.SosSentScreen

// Connects screens together: which button goes where.
// The two SOS screens follow the incident engine: while an SOS is being written the compose screen
// shows, once the alert is sent the "SOS sent" screen shows, whichever way the SOS was started.
@Composable
fun AppNavGraph() {
    val nav = rememberNavController()
    val incident by AppServices.incident.view.collectAsState()
    fun open(screen: Screen) = nav.navigate(screen.route) { popUpTo(Screen.Home.route); launchSingleTop = true }

    LaunchedEffect(incident.phase, incident.alertSent) {
        if (!AppServices.onboarding.isDone()) return@LaunchedEffect
        when {
            incident.phase == IncidentPhase.SosActive && !incident.alertSent -> open(Screen.SosCompose)
            incident.phase == IncidentPhase.SosActive || incident.phase == IncidentPhase.Resolved -> open(Screen.SosSent)
        }
    }

    // First launch starts with onboarding; after that, straight to Home.
    val start = if (AppServices.onboarding.isDone()) Screen.Home.route else Screen.Onboarding.route
    NavHost(nav, startDestination = start) {
        composable(Screen.Onboarding.route) {
            OnboardingFlow(onFinished = { nav.navigate(Screen.Home.route) { popUpTo(Screen.Onboarding.route) { inclusive = true } } })
        }
        composable(Screen.Home.route) {
            HomeScreen(
                // Held for 1.5 s: start the SOS (the effect above opens its screen). Already on: just open it.
                onSos = { if (incident.phase == IncidentPhase.SosActive) open(if (incident.alertSent) Screen.SosSent else Screen.SosCompose) else AppServices.incident.startSos(ActivationMethod.SosButton) },
                onEditContacts = { nav.navigate(Screen.Contacts.route) },
                onAsk = { question -> nav.navigate("${Screen.Ask.route}?q=${Uri.encode(question)}") },
            )
        }
        composable(Screen.SosCompose.route) { SosComposeScreen(onCancelled = { nav.popBackStack(Screen.Home.route, inclusive = false) }) }
        composable(Screen.SosSent.route) { SosSentScreen(onLeave = { nav.popBackStack(Screen.Home.route, inclusive = false) }) }
        composable(Screen.Contacts.route) { ContactsScreen(onBack = { nav.popBackStack() }) }
        composable("${Screen.Ask.route}?q={q}", arguments = listOf(navArgument("q") { type = NavType.StringType; defaultValue = "" })) { entry ->
            AskBeaconScreen(firstQuestion = entry.arguments?.getString("q").orEmpty(), onBack = { nav.popBackStack() })
        }
    }
}
