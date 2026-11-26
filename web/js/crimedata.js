// Official police crime data, free and keyless, for the red zones on Beacon live's map. Pure: builds the
// request URLs and reads the replies; live/js/unsafezones.js fetches. Cities without an adapter get no crime
// layer (Beacon never makes one up).
//   - New York: NYPD Complaint Data (NYC Open Data, Socrata SODA API, no app token for low volume).
//     Current year 5uac-w243 + historic qgea-i56i, so a 12-month window spans both.
//   - England, Wales and Northern Ireland: data.police.uk street-level crimes (Open Government Licence v3.0).
//     Locations are snapped to anonymous points and dates are month only (no time of day).
// Kept to street crime: robbery, felony assault and grand larceny from the person (NYC, outdoors, 18:00-06:00);
// robbery, violent crime and theft from the person (UK). Sexual offences are left out on purpose (victims' privacy).

export const NYC = { box: [40.49, -74.27, 40.92, -73.68], datasets: ["5uac-w243", "qgea-i56i"],
  page: "https://data.cityofnewyork.us/Public-Safety/NYPD-Complaint-Data-Current-Year-To-Date-/5uac-w243" };
export const UK = { box: [49.8, -8.7, 55.85, 1.8], categories: ["robbery", "violent-crime", "theft-from-the-person"],
  page: "https://data.police.uk/data/", licence: "Open Government Licence v3.0" };

const inBox = ([lat, lng], [s, w, n, e]) => lat >= s && lat <= n && lng >= w && lng <= e;

// Which adapter covers this point: "nyc", "uk" or null. countryCode (ISO, lower case) guards the UK box
// against Ireland and northern France, which it also covers.
export function sourceFor(at, countryCode = "") {
  if (inBox(at, NYC.box)) return "nyc";
  if (countryCode === "gb" && inBox(at, UK.box)) return "uk";
  return null;
}

// A square of about `km` around a point: [south, west, north, east].
export function boxAround([lat, lng], km = 3) {
  const dLat = km / 111.32, dLng = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [lat - dLat, lng - dLng, lat + dLat, lng + dLng].map((x) => +x.toFixed(5));
}

const day = (d) => d.toISOString().slice(0, 10);
// SODA URLs for street crime at night inside `box` since `since` (Date): one per dataset.
export function nycUrls(box, since) {
  const [s, w, n, e] = box;
  const where = "(ofns_desc in('ROBBERY','FELONY ASSAULT') OR pd_desc like 'LARCENY,GRAND FROM PERSON%' OR pd_desc='LARCENY,GRAND PERSON,NECK CHAI')"
    + " AND loc_of_occur_desc!='INSIDE' AND (cmplnt_fr_tm>='18:00:00' OR cmplnt_fr_tm<'06:00:00')"
    + ` AND latitude between ${s} and ${n} AND longitude between ${w} and ${e} AND cmplnt_fr_dt>='${day(since)}'`;
  const q = new URLSearchParams({ $select: "latitude,longitude,ofns_desc", $where: where, $limit: "20000" });
  return NYC.datasets.map((d) => `https://data.cityofnewyork.us/resource/${d}.json?${q}`);
}

const NYC_KIND = { ROBBERY: "robbery", "FELONY ASSAULT": "assault", "GRAND LARCENY": "theft" };
// SODA rows -> [{lat, lng, kind}]. Rows without a usable position are dropped.
export function parseNyc(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({ lat: +r.latitude, lng: +r.longitude, kind: NYC_KIND[r.ofns_desc] || "other" }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat !== 0);
}

// data.police.uk: one URL per category and month (YYYY-MM), for the 1-mile circle around `at`.
export function ukUrls([lat, lng], months) {
  return UK.categories.flatMap((c) => months.map((m) => `https://data.police.uk/api/crimes-street/${c}?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}&date=${m}`));
}
// The `n` months up to the latest one published ("2026-09" -> ["2026-09", "2026-08", "2026-07"]).
export function lastMonths(latest, n = 3) {
  let [y, m] = latest.split("-").map(Number);
  const out = [];
  for (let i = 0; i < n; i++) { out.push(`${y}-${String(m).padStart(2, "0")}`); if (--m === 0) { m = 12; y--; } }
  return out;
}
// Snap points named after a kind of place, not a street ("On or near Nightclub", "On or near Parking Area").
const GENERIC = /\/|\b(area|supermarket|nightclub|petrol station|police station|hospital|theatre|hall|centre|building|subway|open space|bus station|train station|shopping)\b/i;
const UK_KIND = { robbery: "robbery", "violent-crime": "assault", "theft-from-the-person": "theft" };
// data.police.uk rows -> [{lat, lng, kind, street}]. "On or near The Cut" -> "The Cut".
export function parseUk(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({ lat: +r.location?.latitude, lng: +r.location?.longitude, kind: UK_KIND[r.category] || "other",
    street: ukStreet(r.location?.street?.name) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat !== 0);
}

function ukStreet(name) {
  const s = String(name || "").replace(/^On or near\s+/i, "").trim();
  return GENERIC.test(s) ? "" : s;
}

// How each source is described on a zone.
export function describe(src, { latest = "" } = {}) {
  if (src === "nyc") return { origin: "Police data", period: "last 12 months", night: true, source: NYC.page };
  return { origin: "Police data", period: "last 3 months", night: false, source: UK.page, licence: UK.licence, latest };
}
