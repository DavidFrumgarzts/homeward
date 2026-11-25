// Pure helpers for "Beacon found your booking": the AI prompt, reading its answer, and the hospital warning.
// Where the text comes from (Gmail, the sample, a paste) and the map lookups live in live/js/bookingflow.js.

// A made-up confirmation for the sample button. Sam is a real village by the dunes near Jaisalmer, far from a
// hospital; the camp and the booking number are invented, so no real business is named.
export const SAMPLE_BOOKING = `Booking confirmed (sample)
Thar Stars Desert Camp (sample)
Sam Sand Dunes Road, Sam, Jaisalmer, Rajasthan 345001, India
Check-in: Thu 3 Dec 2026, 2:00 PM
Check-out: Mon 7 Dec 2026, 11:00 AM
Guest: Julia · 1 room, 2 adults
Booking number: SAMPLE-4821`;

export function bookingPrompt(text) {
  return `This is a hotel booking email. Find the hotel and where it is. Reply with JSON only:
{"hotel": "...", "address": "street and town, as written", "city": "town or city", "country": "...", "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD"}
Use "" for anything the email doesn't say. Copy names exactly; don't guess.
EMAIL
${String(text).slice(0, 6000)}`;
}

// The AI's answer -> {hotel, address, city, country, checkIn, checkOut}, or null without a hotel and a city.
export function readBooking(aiText) {
  const m = String(aiText || "").match(/\{[\s\S]*\}/);
  let b; try { b = m && JSON.parse(m[0]); } catch { return null; }
  if (!b || !String(b.hotel || "").trim() || !String(b.city || "").trim()) return null;
  const f = (k) => String(b[k] || "").trim();
  return { hotel: f("hotel"), address: f("address"), city: f("city"), country: f("country"), checkIn: f("checkIn"), checkOut: f("checkOut") };
}

const time = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h${m ? ` ${m}` : ""}` : `${m} min`; };
// nearest: {name, minutes} by car, or null when no hospital was found within 60 km.
export function hospitalWarning(nearest) {
  if (!nearest) return { warn: true, text: "No hospital found within 60 km. Save the ambulance number and plan how you'd get help." };
  if (nearest.minutes > 30) return { warn: true, text: `No hospital within a 30-min drive. Nearest: ${nearest.name}, ${time(nearest.minutes)} by car.` };
  return { warn: false, text: `Nearest hospital: ${nearest.name}, ${time(nearest.minutes)} by car.` };
}

// Gmail search: hotel booking emails from the last 6 months.
export const gmailQuery = "newer_than:6m (hotel OR hostel OR guesthouse OR resort OR camp) (booking OR reservation) (confirmed OR confirmation OR check-in)";

// An email body (HTML or text) -> plain text for the AI.
export function plainText(html) {
  return String(html)
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}
