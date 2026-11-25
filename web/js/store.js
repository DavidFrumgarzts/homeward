// Remembers things on this device: your name, who gets your SOS, whether setup is done, and the ids
// of your trip's family link. Everything here stays in the browser (localStorage).
const KEY = "beacon.v1";

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function write(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private window: keep going without saving */ }
}

export const store = {
  get name() { return read().name || ""; },
  set name(value) { write({ ...read(), name: value.trim() }); },
  get contacts() { return read().contacts || []; },
  addContact(name, phone) { const d = read(); write({ ...d, contacts: [...(d.contacts || []), { name: name.trim(), phone }] }); },
  removeContact(index) { const d = read(); write({ ...d, contacts: (d.contacts || []).filter((_, i) => i !== index) }); },
  // Her trip and its family link in Firestore: { tripId, shareId, created }. Made at the first SOS.
  get trip() { return read().trip || null; },
  set trip(value) { write({ ...read(), trip: value }); },
  // An SOS that could not be written to Firestore yet (first visit with no connection).
  get pending() { return read().pending || null; },
  set pending(value) { write({ ...read(), pending: value }); },
  // The "Add my location to I'm OK" switch on the contacts screen. On unless she turns it off.
  get shareLocation() { return read().shareLocation !== false; },
  set shareLocation(value) { write({ ...read(), shareLocation: !!value }); },
  get setupDone() { return !!read().setupDone; },
  set setupDone(value) { write({ ...read(), setupDone: value }); },
  reset() { try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ } },
};

// A phone number we can text: "+" then 8 to 15 digits (same rule as the Android app).
export function cleanPhone(text) {
  const digits = text.replace(/[^\d+]/g, "");
  return /^\+\d{8,15}$/.test(digits) ? digits : null;
}

// "Mom", "Mom and Dad", "Mom, Dad and Alwis"
export function joinNames(names) {
  if (names.length < 2) return names[0] || "";
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

// "+972541233021" -> "+97254 ··· 3021": enough to recognize the number on a contact card.
export function shortPhone(phone) {
  return phone.length < 11 ? phone : `${phone.slice(0, -7)} ··· ${phone.slice(-4)}`;
}
