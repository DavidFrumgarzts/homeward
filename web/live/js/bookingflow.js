// "Beacon found your booking": booking text (Gmail, the sample, or pasted) -> hotel on the map, hospitals around it,
// the drive to the nearest one, and the 30-minute warning. The booking is kept in this browser only.
import { askAi } from "../../js/ai.js";
import { bookingPrompt, readBooking, readBookingPlain, hospitalWarning, SAMPLE_BOOKING } from "../../js/booking.js";
import { hospitalsAround, saveHospitalDrive } from "./drive.js";

const KEY = "beacon.booking";
export const savedBooking = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };

async function geocode(q) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(10000) });
    const hit = (await r.json())[0];
    return hit ? { lat: +hit.lat, lng: +hit.lon } : null;
  } catch { return null; }
}

// onStep(text) reports progress. Returns {booking, at, hospitals, nearest, warning} or {error: "no-ai"|"unreadable"|"not-found"}.
export async function checkBooking(text, onStep = () => {}) {
  onStep("Reading the booking…");
  // The sample is only a demo: it is never saved as her hotel, and its hospital drive isn't kept.
  const sample = text === SAMPLE_BOOKING;
  const ai = await askAi(bookingPrompt(text));
  const booking = (ai && readBooking(ai.text)) || readBookingPlain(text); // without AI: a plain reading
  if (!booking) return { error: ai ? "unreadable" : "no-ai" };
  onStep(`Finding ${booking.hotel} on the map…`);
  const place = [booking.address, booking.city, booking.country].filter(Boolean).join(", ");
  const at = (await geocode(place)) || (await geocode(`${booking.city}, ${booking.country}`));
  if (!at) return { error: "not-found", booking };
  onStep("Looking for hospitals around it…");
  const hospitals = await hospitalsAround(at);
  onStep(hospitals?.length ? "Checking the drive to the nearest hospitals…" : "Finishing up…");
  const nearest = hospitals?.length ? await saveHospitalDrive(at, hospitals, { save: !sample }) : null;
  const warning = hospitalWarning(nearest && { name: nearest.name, minutes: nearest.minutes }, { failed: hospitals === null, found: hospitals?.length || 0 });
  const result = { booking, at: [at.lat, at.lng], hospitals: hospitals ? hospitals.slice(0, 20) : null, nearest, warning, aiSource: ai?.source || null, sample, savedAt: Date.now() };
  if (!sample) try { localStorage.setItem(KEY, JSON.stringify(result)); } catch { /* full */ }
  return result;
}
