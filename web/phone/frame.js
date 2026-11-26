// Phone-frame demo hook. Loaded by js/app.js and live/js/app.js ONLY when the address has ?frame=phone
// (the iframe in web/phone/index.html). Never loaded otherwise, so the real apps are unchanged.
// It makes the app behave as on an iPhone 18 Pro without touching the phone's own features:
//   - safe areas: content starts below the Dynamic Island (62 px) and ends above the home indicator (34 px);
//   - sms: and tel: links are stopped and shown on the demo page instead (nothing texts or calls anyone);
//   - the position comes from ?at=lat,lng (both apps), so no location prompt;
//   - the camera permission step gets an empty stream (Scan still takes an uploaded photo).
// Automatic texts (live/js/texts.js) check the same flag themselves and never reach the sendText function.
import { SCREEN, deviceLink } from "./links.js";

const query = new URLSearchParams(location.search);
const root = document.documentElement;
root.classList.add("beacon-phone");
root.style.setProperty("--safe-top", `${SCREEN.safeTop}px`);
root.style.setProperty("--safe-bottom", `${SCREEN.safeBottom}px`);
const style = document.createElement("style");
style.textContent = `
html.beacon-phone { scrollbar-width: none; }
html.beacon-phone #app { padding-top: var(--safe-top); padding-bottom: var(--safe-bottom); }
html.beacon-phone body::before { content: ""; position: fixed; left: 0; right: 0; top: 0; height: var(--safe-top); background: var(--bg); z-index: 2000; pointer-events: none; }
html.beacon-phone #ai-status { bottom: calc(16px + var(--safe-bottom)); }`;
document.head.append(style);

// Tells the demo page (the parent) what the phone would have done.
export function tell(message) {
  if (parent !== window) parent.postMessage({ beaconPhone: true, ...message }, location.origin);
  else console.info("[phone demo]", message);
}

// sms: and tel: links: stop the navigation, let the app's own click handler run (Rio's SOS moves on
// to the "sent" screen that way), and show the text or number on the demo page.
const stop = (e) => {
  const a = e.target.closest?.("a[href]");
  const link = a && deviceLink(a.getAttribute("href"));
  if (!link) return;
  e.preventDefault();
  if (e.type === "click") tell(link);
};
addEventListener("click", stop, true);
addEventListener("auxclick", stop, true);

// Position from ?at=lat,lng instead of the browser's location.
const at = (query.get("at") || "").split(",").map(Number);
if (at.length === 2 && at.every(Number.isFinite)) {
  const fix = () => ({ coords: { latitude: at[0], longitude: at[1], accuracy: 12, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() });
  const fake = {
    getCurrentPosition: (ok) => setTimeout(() => ok(fix()), 200),
    watchPosition: (ok) => { setTimeout(() => ok(fix()), 200); return 1; },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, "geolocation", { value: fake, configurable: true });
}

// The onboarding's "allow the camera" step: an empty stream, no camera light.
if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => { tell({ kind: "camera" }); return new MediaStream(); };
