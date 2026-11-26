import SwiftUI

// Everything shown while an SOS is on: first the compose screen (say what's happening, check the
// text), then the active screen (who was told, what to do now). Which one is decided by the
// incident's state, never by the screens themselves. Also hosts the Messages sheet.
struct SosFlow: View {
    @EnvironmentObject private var incident: IncidentEngine

    var body: some View {
        Group {
            if incident.view.phase == .sosActive && !incident.view.alertSent { SosComposeScreen() } else { SosActiveScreen() }
        }
        .background(BeaconColors.background.ignoresSafeArea())
        .sensoryFeedback(.impact(weight: .heavy), trigger: incident.view.alertSent) { _, sent in sent } // Send pressed
        .sheet(item: $incident.compose) { request in
            MessageComposer(request: request) { outcome in incident.composeFinished(request, outcome) }.ignoresSafeArea()
        }
    }
}
