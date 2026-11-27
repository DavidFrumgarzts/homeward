// "Get alerts on this phone" on the family page. With it on, her trusted person gets a notification by itself
// (Firebase Cloud Messaging, free) when she sends an SOS, walks into an area marked dangerous, or stops on her
// way back. Saves this browser's push token at trips/{tripId}/watchers/{me}; only the server sends with it.
// iPhone: Apple only allows web notifications from a page added to the Home Screen (iOS 16.4 or later).
import { firebase, firestore, signedIn, SDK } from "./firebase.js";

// Public key from Firebase console > Project settings > Cloud Messaging > Web Push certificates.
const VAPID = "BMFomnGEpp5d_iZsIF-AZePxIT5UxQnwOhK4NaeL8X7qkfvzrSbeiWfdp3x4waW-t4q-9NPBRteS-UDe36yr5sU";
const ON = "beacon.alertsOn";

const ios = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = () => navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;

// "on" | "off" | "blocked" | "home-screen" (iPhone, not added yet) | "unsupported"
export function alertsState(shareId) {
  if (ios() && !standalone()) return "home-screen";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return Notification.permission === "granted" && localStorage.getItem(ON) === shareId ? "on" : "off";
}

// Must run from a tap. Returns the new state, or "failed".
export async function turnOnAlerts(shareId) {
  if ((await Notification.requestPermission()) !== "granted") return alertsState(shareId);
  try {
    const [fb, fs, uid] = await Promise.all([firebase(), firestore(), signedIn()]);
    if (!fb || !fs || !uid) return "failed";
    const share = await fs.f.getDoc(fs.f.doc(fs.db, "shares", shareId));
    if (!share.exists() || share.data().revoked) return "failed";
    const { getMessaging, getToken } = await import(`${SDK}/firebase-messaging.js`);
    const token = await getToken(getMessaging(fb.app), { vapidKey: VAPID, serviceWorkerRegistration: await navigator.serviceWorker.register("/sw.js") });
    if (!token) return "failed";
    await fs.f.setDoc(fs.f.doc(fs.db, "trips", share.data().tripId, "watchers", uid), { token, shareId, createdAtMillis: Date.now() });
    localStorage.setItem(ON, shareId);
    return "on";
  } catch { return "failed"; }
}
