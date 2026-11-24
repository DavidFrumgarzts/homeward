package app.beacon.navigation

// Every screen in the app and its route name. Add a screen here first, then in AppNavGraph.
enum class Screen(val route: String) {
    Home("home"),
    SafetyMap("map"),
    SosCompose("sos"),
    SosSent("sos_sent"),
}
