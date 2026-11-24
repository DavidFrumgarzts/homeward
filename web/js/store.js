// Remembers things on this device: your name, who gets your SOS, and whether setup is done.
// Everything stays in the browser (localStorage); nothing is sent anywhere.
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
