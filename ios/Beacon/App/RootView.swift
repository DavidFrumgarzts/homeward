import SwiftUI

// Every screen in the app that Home can open, and how to get there.
enum Route: Hashable {
    case ask(String)   // Ask Beacon; the string is a question to ask straight away ("" = empty chat)
    case contacts
}

// Decides what is on screen: setup on first launch, then Home (the map). The SOS screens cover
// everything whenever an SOS is active, however it was started.
struct RootView: View {
    @EnvironmentObject private var store: LocalStore
    @EnvironmentObject private var incident: IncidentEngine
    @State private var path: [Route] = []

    var body: some View {
        Group {
            if store.onboardingDone { main } else { OnboardingFlow() }
        }
        .background(BeaconColors.background.ignoresSafeArea())
        // Text follows the size picked in Settings (Dynamic Type), up to the third accessibility size,
        // where the SOS screens and Home's sheet still fit on a 6.1-inch iPhone.
        .dynamicTypeSize(...DynamicTypeSize.accessibility3)
    }

    private var main: some View {
        NavigationStack(path: $path) {
            HomeScreen(onAsk: { path.append(.ask($0)) }, onEditContacts: { path.append(.contacts) })
                .toolbar(.hidden, for: .navigationBar)
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .ask(let question): AskBeaconScreen(firstQuestion: question)
                    case .contacts: ContactsScreen()
                    }
                }
        }
        .fullScreenCover(isPresented: .constant(incident.view.phase == .sosActive || incident.view.phase == .resolved)) {
            SosFlow()
        }
    }
}
