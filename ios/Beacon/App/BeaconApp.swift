import SwiftUI

// The app's entry point. Starts the shared services once, then shows the first screen.
@main
struct BeaconApp: App {
    @StateObject private var services = AppServices.shared

    init() { AppServices.shared.start() }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(services.store)
                .environmentObject(services.packs)
                .environmentObject(services.location)
                .environmentObject(services.sync)
                .environmentObject(services.incident)
                .preferredColorScheme(.light) // Beacon's warm paper look is the same day and night
        }
    }
}
