// PURE LOGIC for the phone-frame demo (web/phone/). Tested in tests/phone.test.js.
// Nothing here touches the page, so the demo page and the hook inside the apps share it.

// The iPhone 18 Pro screen in CSS pixels, and what iOS keeps clear at the top (Dynamic Island and
// status bar) and the bottom (home indicator).
export const SCREEN = { width: 402, height: 874, safeTop: 62, safeBottom: 34 };

// Where the phone is. The default is the real one: the app asks the browser (Chrome asks you once, for
// localhost). The others are optional pretend places, passed to the apps as ?at=lat,lng.
export const PLACES = [
  { id: "device", name: "Use my real location", at: "" },
  { id: "jaipur", name: "Jaipur", at: "26.9157,75.8069" },
  { id: "times-square", name: "Times Square", at: "40.758,-73.9855" },
  { id: "lapa", name: "Lapa, Rio", at: "-22.9095,-43.18421" },
];

export const APPS = [
  { id: "live", name: "Beacon live", path: "/live/" },
  { id: "rio", name: "Rio Beacon", path: "/" },
  { id: "family", name: "Family view", path: "/demo" },
];

// The address the phone's iframe opens: always ?frame=phone, plus the position and ?reset when asked.
export function frameSrc(path, { at = "", reset = false } = {}) {
  const parts = ["frame=phone"];
  if (at) parts.push(`at=${at}`);
  if (reset) parts.push("reset");
  return `${path}?${parts.join("&")}`;
}

// What a link would make the phone do, or null for an ordinary link.
//   sms:+1555,+44777?&body=Hi  ->  { kind: "sms", to: ["+1555", "+44777"], body: "Hi" }
//   tel:190                     ->  { kind: "tel", to: ["190"], body: "" }
export function deviceLink(href) {
  const m = /^(sms|tel):([^?&]*)(.*)$/i.exec(String(href || "").trim());
  if (!m) return null;
  const kind = m[1].toLowerCase();
  const to = decodeURIComponent(m[2]).split(",").map((n) => n.trim()).filter(Boolean);
  const body = kind === "sms" ? new URLSearchParams(m[3].replace(/^[?&]+/, "")).get("body") ?? "" : "";
  return { kind, to, body };
}

// How much to shrink the phone (w x h) to fit the space it has. Never larger than 1; two decimals.
export function fitScale(spaceW, spaceH, w, h) {
  if (!(spaceW > 0 && spaceH > 0)) return 1;
  return Math.max(0.3, Math.min(1, Math.floor(Math.min(spaceW / w, spaceH / h) * 100) / 100));
}
