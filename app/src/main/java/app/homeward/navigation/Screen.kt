package app.homeward.navigation

// Every screen in the app and its route name. Add a screen here first, then in AppNavGraph.
// Home IS the map (map-first, like Find My / Waze), so there is no separate map screen.
enum class Screen(val route: String) {
    Onboarding("onboarding"),
    Home("home"),
    SosCompose("sos"),
    SosSent("sos_sent"),
    Contacts("contacts"),
    Ask("ask"), // Ask Beacon; the question travels as ask?q=…
    Scan("scan"), // the scan check: is this exchange board, meter or price legit?
}
