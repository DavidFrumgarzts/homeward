import FirebaseAppCheck
import FirebaseAuth
import FirebaseCore
import FirebaseFirestore
import Foundation

// Starts Firebase once, at launch: App Check first (every AI call needs its token), then the app,
// offline storage for Firestore, and an anonymous sign-in so this phone can own its trip.
@MainActor
enum FirebaseSetup {
    private(set) static var started = false

    static func start() {
        guard !started else { return }
        #if DEBUG
        // Debug builds: the debug provider. Its token is printed once (below); paste it into the
        // Firebase console > App Check > Apps > Beacon iOS > Manage debug tokens. Until then every
        // AI call is refused, and Beacon answers from its saved rules instead.
        AppCheck.setAppCheckProviderFactory(AppCheckDebugProviderFactory())
        #else
        // Release builds: App Attest (needs the app registered for App Attest in the console).
        AppCheck.setAppCheckProviderFactory(AppAttestFactory())
        #endif
        FirebaseApp.configure()
        started = true

        // Keep writes on the phone when there is no connection, and send them when it is back.
        let settings = FirestoreSettings()
        settings.cacheSettings = PersistentCacheSettings()
        Firestore.firestore().settings = settings

        signIn()
        #if DEBUG
        printDebugTokenOnce()
        #endif
    }

    // Anonymous: no name, no email. The uid only proves "this phone wrote this trip".
    static func signIn() {
        guard started, Auth.auth().currentUser == nil else { return }
        Auth.auth().signInAnonymously { _, error in
            if let error { SyncLog.note("anonymous sign-in failed, will retry when online: \(error.localizedDescription)") } else { SyncLog.note("signed in anonymously") }
        }
    }

    static var uid: String? { started ? Auth.auth().currentUser?.uid : nil }

    #if DEBUG
    private static func printDebugTokenOnce() {
        let key = "appCheckDebugTokenPrinted"
        guard !UserDefaults.standard.bool(forKey: key), let app = FirebaseApp.app(), let provider = AppCheckDebugProvider(app: app) else { return }
        print("Beacon App Check debug token (register it in the Firebase console > App Check > Apps > Manage debug tokens): \(provider.localDebugToken())")
        UserDefaults.standard.set(true, forKey: key)
    }
    #endif
}

#if !DEBUG
private final class AppAttestFactory: NSObject, AppCheckProviderFactory {
    func createProvider(with app: FirebaseApp) -> (any AppCheckProvider)? { AppAttestProvider(app: app) }
}
#endif
