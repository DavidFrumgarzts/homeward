import MessageUI
import SwiftUI
import UIKit

// One place that creates the app's shared objects. Screens ask AppServices (through the SwiftUI
// environment) for what they need, and never talk to Firebase, GPS or Messages directly.
// To find "where does X come from?" you only ever look here.
@MainActor
final class AppServices: ObservableObject {
    static let shared = AppServices()

    let store = LocalStore()
    let packs = PackStore()
    let location = LocationService()
    let network = NetworkMonitor()
    let sync = IncidentSync()
    let incident: IncidentEngine

    // Unit tests launch the app too; they must not sign in or write to Firebase.
    static var isRunningTests: Bool { ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil }

    private init() {
        incident = IncidentEngine(store: store, packs: packs, location: location, network: network, sync: sync)
    }

    func start() {
        store.load()
        DebugLaunch.apply(to: store)
        if !Self.isRunningTests { FirebaseSetup.start() }
        network.onChange = { [weak self] online in self?.incident.onNetwork(online) }
        network.start()
        location.onFix = { [weak self] fix in self?.incident.onLocation(fix) }
        incident.canSendText = { MFMessageComposeViewController.canSendText() }
        incident.dial = { number in Self.dial(number) }
        UIDevice.current.isBatteryMonitoringEnabled = true
        incident.batteryPercent = {
            let level = UIDevice.current.batteryLevel // -1 when the phone doesn't know (the simulator)
            return level < 0 ? nil : Int(level * 100)
        }
    }

    // Opens the phone dialer with a number from the saved pack. iOS asks before it calls.
    // In test mode it never dials: the screens show "Test mode: would call …" instead (TestMode.swift),
    // and this guard makes sure nothing slips through.
    static func dial(_ number: String) {
        guard !TestMode.isOn else { return }
        let digits = number.filter { $0.isNumber || $0 == "+" }
        if let url = URL(string: "tel:\(digits)") { UIApplication.shared.open(url) }
    }
}

// Debug-only launch options, so a tester (or a script) can reach a screen without tapping through setup:
//   -resetBeacon YES     start again from the opening story
//   -demoSetup YES       skip setup with a made-up traveler ("Noa") and three made-up contacts
//                        (US 555-01xx numbers, which are reserved for fiction and never reach a real person)
//   -realTexts YES       on a real iPhone, turn test mode off: open Messages and the dialer for real (TestMode.swift)
@MainActor
enum DebugLaunch {
    static func apply(to store: LocalStore) {
        #if DEBUG
        let args = UserDefaults.standard
        if args.bool(forKey: "resetBeacon") { store.reset() }
        if args.bool(forKey: "demoSetup") {
            store.profile = UserProfile(name: "Noa")
            store.contacts = [TrustedContact(name: "Mom", phone: "+12025550101"), TrustedContact(name: "Dad", phone: "+12025550102"), TrustedContact(name: "Alwis", phone: "+12025550103")]
            store.onboardingDone = true
        }
        #endif
    }
}
