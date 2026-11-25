import SwiftUI

// Setup step 3: explain in plain words what Beacon needs, then ask iOS for location.
// Moving on works either way; the app falls back gracefully if it is denied.
struct PermissionsStep: View {
    var onNext: () -> Void
    var onBack: () -> Void
    @EnvironmentObject private var location: LocationService
    @State private var asked = false

    var body: some View {
        StepLayout(step: .permissions, title: "What Beacon needs", button: location.status == .notDetermined ? "Allow location" : "Continue", onBack: onBack, onButton: {
            if location.status == .notDetermined { asked = true; location.askPermission() } else { onNext() }
        }) {
            VStack(spacing: BeaconSpacing.cards) {
                FeatureRow(icon: "mappin.and.ellipse", title: "Location, while you use Beacon", detail: "To warn you before red zones and add your spot to an SOS. GPS works with no signal. It is read only while Beacon is open or an SOS you started is running.")
                FeatureRow(icon: "message", title: "Messages, no permission needed", detail: "An iPhone app can't send a text by itself. Beacon opens Messages with your people and the text filled in, and you press send.")
            }
        }
        .onChange(of: location.status) { if asked { onNext() } }
    }
}
