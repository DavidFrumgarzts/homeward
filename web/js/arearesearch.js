// When to ask again for a city's areas to avoid at night. The research itself runs on the server
// (backend/functions/areas.js has the rules: exact quotes from real sources, nothing about who lives there,
// no whole districts, only official sources alert anyone); live/js/areasearch.js asks and saves.
const DAY = 864e5;

// Every 14 days per city, online only; after a failed try, wait an hour.
export function needsAreaResearch(saved, now, online) {
  if (!online) return false;
  if (saved?.triedAt && now - saved.triedAt < 3600_000) return false;
  return !saved?.savedAt || now - saved.savedAt > 14 * DAY;
}
