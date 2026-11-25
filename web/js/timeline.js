// PURE LOGIC for the family view: turns an incident and its location updates (the Firestore documents in
// shared/schema/README.md) into what the page shows: how old the last position is, the trail on the
// map, and the list of what happened. No AI, no network. Tested in tests/timeline.test.js.

// "1:56 AM" in the reader's own time zone. Built by hand so every browser writes it the same way.
export function clockText(millis) {
  const d = new Date(millis), h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

// "just now", "4 min ago", "2 h 5 min ago", "3 days ago"
export function ageText(thenMillis, nowMillis) {
  const minutes = Math.floor(Math.max(0, nowMillis - thenMillis) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  if (hours < 24) return rest ? `${hours} h ${rest} min ago` : `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export const inOrder = (updates) => [...updates].sort((a, b) => a.createdAtMillis - b.createdAtMillis);
const hasPlace = (u) => typeof u.lat === "number" && typeof u.lng === "number";

// The newest update that has a position, or null. Its time is when the GPS fix was taken.
export function latestFix(updates) {
  const last = inOrder(updates).filter(hasPlace).pop();
  return last ? { lat: last.lat, lng: last.lng, atMillis: last.takenAtMillis ?? last.createdAtMillis, accuracyMeters: last.accuracyMeters ?? null, batteryPercent: last.batteryPercent ?? null } : null;
}

// The trail for the map, oldest first, as [lng, lat] pairs (the order maps use).
export const trail = (updates) => inOrder(updates).filter(hasPlace).map((u) => [u.lng, u.lat]);

export function metersBetween(a, b) {
  const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const travelerName = (incident) => (incident.travelerName || "").trim() || "Your contact";

// What happened, newest first: the alert, each update, low battery, the end.
// Each item is { atMillis, kind, title, detail }. It only says what the phone reported.
export function timelineItems(incident, updates) {
  const name = travelerName(incident);
  return inOrder(updates).map((u) => {
    const item = { atMillis: u.createdAtMillis, kind: u.kind, title: "Location update", detail: "" };
    if (u.kind === "alert") {
      item.title = incident.userConfirmed === false ? `${name} did not answer a safety check` : `${name} sent an SOS`;
      item.detail = incident.userConfirmed === false ? "Beacon raised this by itself. It does not know what is happening." : incident.description ? `"${incident.description}"` : "";
    } else if (u.kind === "batteryLow") {
      item.title = "Phone battery is low"; item.detail = "Updates may stop.";
    } else if (u.kind === "ended") {
      item.title = `${name} says the SOS is over`; item.detail = "Beacon stopped sharing the location.";
    } else if (u.pointsHeld > 0) {
      item.detail = `${u.pointsHeld} location ${u.pointsHeld === 1 ? "point was" : "points were"} recorded while the phone had no signal.`;
    }
    if (!hasPlace(u) && u.kind !== "ended") item.detail = [item.detail, "No GPS position with this one."].filter(Boolean).join(" ");
    return item;
  }).reverse();
}
