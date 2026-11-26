// The texts Beacon sends by itself (Twilio SMS). The words are fixed here, on the server, so the function
// can't be used to send anything else: only Beacon's own link, no other links, short, to at most 5 numbers.
export const LIMIT_PER_DAY = 40; // texts per traveler per day
const KINDS = ["sos", "danger", "still", "invite"];
const PHONE = /^\+[1-9]\d{6,14}$/;
const LINK = /^https:\/\/homeward-6999c\.(web\.app|firebaseapp\.com)\/f\/[A-Za-z0-9]{8,64}$/;

const clean = (s, max) => String(s ?? "").replace(/https?:\/\/\S+|www\.\S+/gi, "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max).trim();
const where = (lat, lng) => (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  ? `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}` : "not known");
const digits = (s) => String(s ?? "").replace(/[^\d]/g, "").slice(0, 6);

// Returns {to: [phones], body} or {error: "kind" | "to" | "message" | "link"}.
export function buildText(kind, d = {}) {
  if (!KINDS.includes(kind)) return { error: "kind" };
  const to = Array.isArray(d.to) ? [...new Set(d.to)] : [];
  if (!to.length || to.length > 5 || !to.every((p) => typeof p === "string" && PHONE.test(p))) return { error: "to" };
  const name = clean(d.name, 30) || "Your contact";
  const map = where(d.lat, d.lng), police = digits(d.police) || "112";
  const call = `Maybe call ${name}. Police there: ${police}.`;
  let body;
  if (kind === "sos") {
    const msg = clean(d.message, 480);
    if (!msg) return { error: "message" };
    body = `${msg} Where: ${map}`;
  } else if (kind === "danger") {
    body = `Beacon: ${name} just walked into an area marked dangerous at night (${clean(d.place, 60) || "marked on her map"}). Where: ${map} ${call}`;
  } else if (kind === "still") {
    const m = Math.min(Math.max(Math.round(Number(d.minutes) || 5), 5), 120);
    body = `Beacon: ${name} hasn't moved for ${m} minutes on her way back. Where: ${map} ${call}`;
  } else {
    if (!LINK.test(String(d.link ?? ""))) return { error: "link" };
    body = `${name} added you to Beacon. Open this any time to see how ${name} is: ${d.link}`;
  }
  return { to, body };
}
