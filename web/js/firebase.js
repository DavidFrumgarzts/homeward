// The one place that sets up Firebase for the page: the app, App Check, anonymous sign-in and Firestore.
// js/ai.js (AI), js/incident.js (the traveler's SOS) and js/familydata.js (the family view) all start here.
// Nothing loads until someone asks, and every function answers null when Firebase is not set up or
// cannot be reached, so the page keeps working with no AI and no sync.
//
// Where the project settings come from:
//   - on Firebase Hosting: /__/firebase/init.json, which Hosting serves itself, so no config file is uploaded;
//   - on localhost: ../firebase-config.js (copy firebase-config.example.js; it is git-ignored);
//   - on localhost with ?emu in the address: the Firebase emulators, with a made-up project (tests use this).
export const SDK = "https://www.gstatic.com/firebasejs/13.4.0";
const LOCAL = ["localhost", "127.0.0.1", "[::1]"].includes(globalThis.location?.hostname); // false outside a browser (unit tests)

function emulatorMode() {
  if (!LOCAL) return false;
  try {
    if (new URLSearchParams(location.search).has("emu")) sessionStorage.setItem("beacon.emu", "1");
    return sessionStorage.getItem("beacon.emu") === "1";
  } catch { return false; }
}
export const usingEmulators = emulatorMode();

async function loadConfig() {
  if (usingEmulators) return { apiKey: "fake-api-key", projectId: "demo-beacon", appId: "demo", authDomain: "demo-beacon.firebaseapp.com" };
  if (!LOCAL) {
    try { const reply = await fetch("/__/firebase/init.json"); if (reply.ok) return await reply.json(); } catch { /* not on Firebase Hosting */ }
  }
  try { return (await import("../firebase-config.js")).firebaseConfig; } catch { return null; }
}

// App Check proves a request comes from this app. Firebase AI Logic refuses calls without it.
//   - localhost: the debug provider. The SDK prints "Firebase App Check debug token: ..." in the browser
//     console once; paste that token in the Firebase console (App Check > Apps > web app > Manage debug tokens).
//     To reuse one token on every machine, add `appCheckDebugToken: "..."` to firebase-config.js.
//   - anywhere else: reCAPTCHA Enterprise, with the public site key from appcheck-config.js.
// Returns true when App Check is on. Without it AI stays off (the callers use their plain rules).
async function startAppCheck(app, config) {
  if (usingEmulators) return false;
  try {
    const { initializeAppCheck, ReCaptchaEnterpriseProvider, CustomProvider } = await import(`${SDK}/firebase-app-check.js`);
    if (LOCAL) {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = config.appCheckDebugToken || true;
      // In debug mode the SDK swaps the debug token for a real one and never asks this provider.
      const unused = new CustomProvider({ getToken: () => Promise.reject(new Error("Beacon uses the App Check debug token on localhost")) });
      initializeAppCheck(app, { provider: unused, isTokenAutoRefreshEnabled: true });
      return true;
    }
    const siteKey = config.recaptchaSiteKey || (await import("../appcheck-config.js").then((m) => m.recaptchaSiteKey, () => ""));
    if (!siteKey) return false;
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true });
    return true;
  } catch { return false; }
}

let started = null;
// { app, config, appCheck: true|false } or null when there is no usable config.
export function firebase() {
  started ??= (async () => {
    try {
      const config = await loadConfig();
      if (!config?.apiKey || !config.projectId) return null;
      const { initializeApp } = await import(`${SDK}/firebase-app.js`);
      const app = initializeApp(config);
      return { app, config, appCheck: await startAppCheck(app, config) };
    } catch { return null; }
  })();
  return started;
}

let auth = null;
// Signs in without an account (anonymous) and returns the user id, or null (offline on a first visit, or no Firebase).
export function signedIn() {
  auth ??= (async () => {
    const fb = await firebase();
    if (!fb) return null;
    const { getAuth, signInAnonymously, connectAuthEmulator } = await import(`${SDK}/firebase-auth.js`);
    const a = getAuth(fb.app);
    if (usingEmulators) connectAuthEmulator(a, "http://127.0.0.1:9099", { disableWarnings: true });
    await a.authStateReady();
    return a.currentUser?.uid ?? (await signInAnonymously(a)).user.uid;
  })().catch(() => { auth = null; return null; }); // let the next call try again
  return auth;
}

let store = null;
// { db, f } where f is the Firestore module (doc, setDoc, onSnapshot...), or null. Writes made with no
// connection are kept on this device and sent later (offline persistence).
export function firestore() {
  store ??= (async () => {
    const fb = await firebase();
    if (!fb) return null;
    const f = await import(`${SDK}/firebase-firestore.js`);
    let db;
    try { db = f.initializeFirestore(fb.app, { localCache: f.persistentLocalCache({ tabManager: f.persistentMultipleTabManager() }) }); }
    catch { db = f.getFirestore(fb.app); } // a private window may refuse storage: keep going without it
    if (usingEmulators) f.connectFirestoreEmulator(db, "127.0.0.1", 8080);
    return { db, f };
  })().catch(() => null);
  return store;
}
