package app.beacon.navigation

// Every screen in the app and its route name. Add a screen here first, then in AppNavGraph.
// Home IS the map (map-first, like Find My / Waze), so there is no separate map screen.
enum class Screen(val route: String) {
    Home("home"),
    SosCompose("sos"),
    SosSent("sos_sent"),
}
