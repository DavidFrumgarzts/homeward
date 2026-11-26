// Beacon live: the same app as the Lapa demo, on a real street map, in whatever city you are.
// Your city, its emergency numbers and its scams come from where the phone says you are (city.js).
// Screens: setup -> home -> (ask | scan | sos -> sent). Each builds its HTML into #app and wires its buttons.
// Works offline once opened: the page is saved by sw.js, nearby places are saved in the browser,
// and Ask, Scan and SOS need no signal. The map's street tiles need a connection (the tile provider doesn't allow saving them).
import { store, cleanPhone, joinNames } from "../../js/store.js";
import { askAi } from "../../js/ai.js";
import { scanScreen } from "./scan.js";
import { recommends, judge } from "../../js/scams.js";
import { smsLink } from "../../js/sos.js";
import { placesAround, nearest, saved, meters } from "./places.js";
import { city, scamsHere, savedAt, fromMemory, arriveAt, research, numbers } from "./city.js";
import { savedTrip, planTrip, wayBack, findPlace, addMyArea, areasNow, tripGraph, rerouteTrip } from "./trips.js";
import { drawExtras, drawAreas } from "./routemap.js";
import { loadZones, zonesAround } from "./unsafezones.js";
import { zonesToShow, zoneLine, quietNote } from "../../js/unsafe.js";
import { addBaseMap, loadVectorMap } from "./basemap.js";
import { recordTrail, startAnswering, checkinLink, answersSent, paused, setPaused, turnOffLink, trail } from "./answering.js";
import { sendText, textsSent } from "./texts.js";
import { dangerTexts, stoppedMinutes, shouldTextStill } from "../../js/alerts.js";
import { onboarding } from "./onboard.js";
import { hospitalsAround, saveHospitalDrive, savedHospitalDrive } from "./drive.js";
import { driveText, googleMapsLink } from "../../js/trip.js";
import { placeFromPlan, isPlanning } from "../../js/trip.js";

// Phone-frame demo only (web/phone/): ?frame=phone adds the iPhone safe areas and stops texts and calls.
if (new URLSearchParams(location.search).get("frame") === "phone") await import("../../phone/frame.js");

const app = document.getElementById("app");
const $ = (s) => app.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const here = { at: null, places: saved()?.places || [] }; // at = your real GPS position, null until the phone gives it
const where = () => here.at || city.at; // null until the phone (or the last visit) says where you are
const police = () => numbers().police;
const inCity = () => (city.name ? ` in ${city.name}` : "");
const dist = (m) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);
const KIND_LABEL = { police: "Police station", hospital: "Hospital", pharmacy: "24-hour pharmacy" };
const KIND_COLOR = { police: "#2F6BFF", hospital: "#E5484D", pharmacy: "#22A06B" };
// White symbols inside the map badges (docs/design/landmarks): shield, cross, pill.
const BADGE = {
  police: '<svg viewBox="0 0 26 26"><path d="M13,6.3 l5,2 v3.7 c0,3.3 -2.2,5.5 -5,6.6 c-2.8,-1.1 -5,-3.3 -5,-6.6 v-3.7 z" fill="#fff"/></svg>',
  hospital: '<svg viewBox="0 0 26 26"><rect x="11.2" y="7" width="3.6" height="12" rx="1" fill="#fff"/><rect x="7" y="11.2" width="12" height="3.6" rx="1" fill="#fff"/></svg>',
  pharmacy: '<svg viewBox="0 0 26 26"><g transform="rotate(-45 13 13)"><rect x="7" y="10" width="12" height="6" rx="3" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M13 10v6" stroke="#fff" stroke-width="1.8"/><path d="M13.9 10.9h3.1a2.1 2.1 0 010 4.2h-3.1z" fill="#fff"/></g></svg>',
};
const icon = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#22A06B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="#E5484D" stroke-width="2" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>',
};
const savedHotel = () => {
  let b = null; try { b = JSON.parse(localStorage.getItem("beacon.booking")); } catch { /* none */ }
  if (!b?.at || b.sample || !where()) return null;
  return meters(where(), { lat: b.at[0], lng: b.at[1] }) < 30000 ? b.at : null; // only a hotel in the city she's in
};
// The saved hospital drive, only when it was worked out near where she is now (never another city's).
const driveHere = () => { const d = savedHospitalDrive(); return d && where() && meters(where(), { lat: d.from[0], lng: d.from[1] }) < 5000 ? d : null; };
const homeName = () => (savedTrip()?.homeIsHotel ? "your hotel" : "where you started");
const compassWord = { N: "north", NE: "north-east", E: "east", SE: "south-east", S: "south", SW: "south-west", W: "west", NW: "north-west" };
// The way back as words: "2.9 km · 36 min on busy, lit streets" or, off the saved streets, direction and distance.
function wayText(w) {
  if (!w) return "";
  if (w.arrived) return `You're at ${homeName()}.`;
  if (w.partial) return `You're outside the streets Beacon saved. ${homeName()[0].toUpperCase() + homeName().slice(1)} is ${dist(w.direction.metres)} to the ${compassWord[w.direction.compass]}. This is a direction, not a full route.`;
  const r = w.route, f = w.fastest, extra = f && r.minutes > f.minutes ? ` ${r.minutes - f.minutes} min longer than the fastest way, and it stays on busier streets.` : "";
  if (r.dangerMetres) return `${dist(r.metres)} · ${r.minutes} min. There's no way around it: this route goes through an area to avoid for ${dist(r.dangerMetres)}. Stay on the main road and keep your phone ready.`;
  return `${dist(r.metres)} · ${r.minutes} min on busy, lit streets.${extra}${f?.dangerMetres ? " It goes around the areas to avoid." : ""}`;
}
let avoiding = null; // corners tapped while marking an area to avoid
const helpPlace = () => (where() ? nearest(here.places, where(), ["police", "hospital"]) || nearest(here.places, where()) : null);
// Desktop layout (../styles.css, "Desktop layout"): from 900 px wide Ask and Scan take over Home's side panel
// while the map stays. Under 900 px they fill the screen, as on the phone.
const wide = matchMedia("(min-width: 900px)");
function panel() {
  const side = wide.matches && app.querySelector(":scope > .sheet, :scope > .side");
  if (!side) return app;
  side.className = "side"; // no longer Home's sheet, so GPS updates don't redraw Home over the chat
  return side;
}
wide.addEventListener("change", () => { if (app.querySelector(":scope > .side")) home(); });

// ---------- Setup: your name and who gets your SOS ----------
function setup() {
  app.innerHTML = `<div class="screen settings">
    <h1>Beacon</h1>
    <p>If something goes wrong, Beacon writes a clear message for the people you trust, with where you are. Point the camera at a deal or a stranger's offer and it tells you if travelers report it as a scam where you are.</p>
    <input class="field" id="name" placeholder="Your first name" value="${esc(store.name)}" autocomplete="given-name">
    <div class="label">Who should hear from you?</div>
    ${store.contacts.map((c, i) => `<div class="card"><div class="grow"><div class="label">${esc(c.name)}</div><p class="small">${esc(c.phone)}</p></div><button class="link small" data-del="${i}">Remove</button></div>`).join("")}
    <input class="field" id="cname" placeholder="Name (Mom, a friend…)">
    <input class="field" id="cphone" placeholder="Phone with country code, +1 212 555 0100" inputmode="tel">
    <p class="error" id="error"></p>
    <button class="link left" id="add">Add this person</button>
    ${store.contacts.length ? `<div class="card col"><div class="label">They can ask how you are, any time</div>
      <p class="small">Beacon answers by itself with where you are, your route and your plans, locked so only they can read it. You see every answer here.</p>
      <a class="btn quiet" id="sendlink" href="#">Text them their check-in link</a>
      <label class="row small"><input type="checkbox" id="pause" ${paused() ? "checked" : ""}> Pause answers for now</label>
      ${textsSent().slice(0, 5).map((t) => `<p class="small">Texted ${esc(joinNames(t.to))} at ${new Date(t.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}: ${esc(t.what)}${t.status === "sent" ? "" : ` (${esc(t.status)})`}</p>`).join("")}
      ${answersSent().slice(0, 5).map((a) => `<p class="small">${esc(a.who)} asked at ${new Date(a.askedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Beacon answered: “${esc(a.text)}”</p>`).join("")}
      ${store.trip ? '<button class="link left small" id="linkoff">Turn off their link (they\'ll need a new one)</button>' : ""}</div>` : ""}
    <div class="grow"></div>
    <button class="btn" id="done">Start</button>
  </div>`;
  const add = () => {
    const name = $("#cname").value.trim(), phone = cleanPhone($("#cphone").value);
    if (!name && !$("#cphone").value.trim()) return true;
    if (!name || !phone) { $("#error").textContent = "Add a name and a phone number that starts with + and the country code."; return false; }
    store.name = $("#name").value; store.addContact(name, phone); return true;
  };
  $("#add").onclick = () => add() && setup();
  $("#pause")?.addEventListener("change", (e) => setPaused(e.target.checked));
  $("#linkoff")?.addEventListener("click", async () => { await turnOffLink(); setup(); });
  $("#sendlink")?.addEventListener("click", async (e) => {
    e.preventDefault(); store.name = $("#name").value;
    e.target.textContent = "Sending…";
    const link = await checkinLink({ city: city.name, country: city.country });
    if (!link) { e.target.textContent = "Text them their check-in link"; return ($("#error").textContent = "Beacon needs a connection once to make the link."); }
    const r = await sendText("invite", { link });
    answer(); setup();
    if (r === "waiting") $("#error").textContent = "No signal: Beacon sends it as soon as there's a connection.";
  });
  app.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => { store.removeContact(+b.dataset.del); setup(); }));
  $("#done").onclick = () => {
    if (!add()) return;
    if (!store.contacts.length) return ($("#error").textContent = "Add at least one person to get your SOS.");
    store.name = $("#name").value; store.setupDone = true; home();
  };
}

// ---------- Home: the map, Ask Beacon, the nearest place to get help, Scan, SOS ----------
let map = null;
function home(highlight = null, way = null) {
  const shown = here.places.find((p) => p.name === highlight) || null;
  const card = shown && where() ? { ...shown, meters: meters(where(), shown) } : helpPlace();
  app.innerHTML = `
    <div class="mapwrap" style="min-height:320px"><div id="map"></div>
      <div class="map-tools"><button id="avoid">${avoiding ? `Tap corner ${avoiding.length + 1} of 4` : "Avoid an area"}</button></div>
      ${here.at ? "" : `<div class="hint small">${here.denied ? "Turn on location so Beacon knows which city you're in." : "Finding where you are…"}</div>`}</div>
    <div class="sheet"><div class="grab"></div>${city.name ? `<div class="side-head"><span class="brand">Beacon</span><span class="small">${esc(`${city.name}${city.country ? `, ${city.country}` : ""}`)}</span></div>` : '<div class="side-head"><span class="brand">Beacon</span></div>'}
      <button class="askbar" id="ask"><span>Ask Beacon anything</span><i class="sq">${icon.arrow}</i></button>
      <div class="chips">${[savedTrip() ? (savedTrip().homeIsHotel ? "Way back to my hotel" : "Way back to where I started") : "I'm going out tonight", "Where can I get help?", "I think I'm being followed"].map((q) => `<button class="chip" data-q="${q}">${q}</button>`).join("")}</div>
      ${way?.drive ? `<div class="card route-card"><div class="label">Drive to ${esc(way.drive.name)}</div><p class="small">${esc(driveText(way.drive))} · saved for no signal · route © OpenStreetMap contributors</p></div>` : ""}
      ${way && !way.drive ? `<div class="card route-card"><div class="label">Back to ${homeName()}</div><p class="small">${esc(wayText(way))}</p>${routeNotes(way)}${way.route ? `<p class="small">${esc(way.route.steps.slice(0, 4).map((x) => `${x.name} ${dist(x.m)}`).join(" → "))}</p><p class="small">Saved for no signal · route © OpenStreetMap contributors</p>` : ""}</div>` : ""}
      ${card ? `<button class="card" id="place"><i class="dot big" style="background:${KIND_COLOR[card.kind]}"></i><div><div class="label">${esc(card.name)} · ${dist(card.meters)}</div><p class="small">${KIND_LABEL[card.kind]} · open 24 hours</p></div></button>`
             : `<div class="card"><p class="small">${!where() ? "Places to get help show up once Beacon knows where you are." : navigator.onLine ? "Looking for police stations and hospitals near you…" : "Go online once to save places near you."}</p></div>`}
      <div class="two"><a id="ok" href="#">${icon.check}I'm OK</a><button id="scan">${icon.camera}Scan</button><a href="tel:${police()}">${icon.phone}${police()}</a></div>
      <button class="btn red" id="sos">SOS</button>
      <div class="foot small"><span>Goes to ${esc(joinNames(store.contacts.map((c) => c.name)))}</span><button class="link small" id="edit">Edit</button></div>
    </div>`;
  drawMap(shown, way);
  $("#avoid").onclick = () => { avoiding = avoiding ? null : []; home(highlight, way); };
  $("#ask").onclick = () => ask("");
  app.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => ask(b.dataset.q)));
  $("#place")?.addEventListener("click", () => home(card.name));
  const okText = `${store.name || "I"} ${store.name ? "is" : "am"} OK · ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${here.at ? `\nWhere: https://maps.google.com/?q=${here.at.lat.toFixed(5)},${here.at.lng.toFixed(5)}` : ""}`;
  $("#ok").href = smsLink(store.contacts.map((c) => c.phone), okText);
  $("#scan").onclick = openScan;
  $("#sos").onclick = () => sos();
  $("#edit").onclick = setup;
}

// The scan check, with the scams saved for the city you're in (and whether they're being updated).
function scanStatus() {
  if (city.researching) return `Looking up the latest reports for ${city.name}…`;
  const at = savedAt();
  const day = new Date(at).toLocaleDateString([], { month: "short", day: "numeric" });
  if (!at) return "Saved on this phone. Works with no signal.";
  return fromMemory() ? `Some added ${day} from what AI knows, not checked. Works with no signal.` : `Updated from the web ${day}. Works with no signal.`;
}
function openScan() {
  scanScreen(panel(), { back: () => home(), backIcon: icon.back, city: city.name, scams: scamsHere(), status: scanStatus() });
}

// The street map (OpenStreetMap through Leaflet): you as a green dot, places to get help, and a yellow ring
// that blinks around a recommended place (`shown`) and then stays until you tap the map.
function drawMap(shown, way = null) {
  if (!window.L) { $("#map").innerHTML = '<p class="small" style="padding:16px">The map needs a connection. Everything else works offline.</p>'; return; }
  map?.remove();
  const at = where();
  map = L.map($("#map"), { zoomControl: false, attributionControl: true, minZoom: 2, maxZoom: 19 });
  L.control.zoom({ position: "bottomright" }).addTo(map); // shown on desktop only (live.css)
  new ResizeObserver(() => map?.invalidateSize()).observe($("#map")); // the layout changes size at 900 px
  if (!at) map.setView([25, 0], 2); // no position yet: the world, until the phone says where you are
  else map.setView(shown ? [(at.lat + shown.lat) / 2, (at.lng + shown.lng) / 2] : [at.lat, at.lng], 16);
  addBaseMap(map); // David's map colors from OpenFreeMap vector tiles; CARTO's pictures if that can't load (basemap.js)
  // Places as small round badges (police, hospital, 24-hour pharmacy) with the name to the right in the badge's
  // color, like the onboarding art; a name shows only where it doesn't run into another badge or name (nameBadges).
  const badges = [];
  for (const p of here.places) {
    if (!p.open24h) continue;
    const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: `place-badge ${p.kind}`, html: `<i>${BADGE[p.kind] || ""}</i><b>${esc(p.name)}</b>`, iconSize: [24, 24] }), keyboard: false })
      .bindTooltip(esc(p.name)).addTo(map); // OSM names are outside data: escaped
    badges.push({ p, m });
  }
  if (shown) {
    L.circleMarker([shown.lat, shown.lng], { radius: 20, className: "go-here" }).addTo(map);
    if (!avoiding) map.once("click", () => home());
  }
  const trip = savedTrip(), hotel = savedHotel() || (trip?.homeIsHotel ? trip.home : null);
  drawExtras(map, { way, home: hotel, places: here.places, at: here.at });
  zoneWay = way; redrawZones();
  if (way?.route) map.fitBounds(L.latLngBounds(way.route.path).pad(0.15));
  if (avoiding) map.on("click", (e) => {
    avoiding.push([e.latlng.lat, e.latlng.lng]);
    if (avoiding.length < 4) { $("#avoid").textContent = `Tap corner ${avoiding.length + 1} of 4`; L.circleMarker(e.latlng, { radius: 4, color: "#E5484D" }).addTo(map); return; }
    addMyArea(avoiding); avoiding = null; home(null, savedTrip() && where() ? wayBack([where().lat, where().lng]) : null);
  });
  me = here.at ? L.marker([here.at.lat, here.at.lng], { icon: meIcon(), interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map) : null;
  nameBadges(map, badges);
  map.on("zoomend", () => nameBadges(map, badges));
}
// Shows place names, closest places first, only where the name's box overlaps no badge, no other name and not you.
function nameBadges(map, badges) {
  const size = map.getSize(), at = where(), taken = [];
  const all = badges.map((b) => ({ ...b, pt: map.latLngToContainerPoint([b.p.lat, b.p.lng]) }));
  for (const { pt } of all) taken.push([pt.x - 13, pt.y - 13, pt.x + 13, pt.y + 13]);
  if (at) { const u = map.latLngToContainerPoint([at.lat, at.lng]); taken.push([u.x - 20, u.y - 20, u.x + 20, u.y + 20]); all.sort((a, b) => meters(at, a.p) - meters(at, b.p)); }
  const free = (box) => box[0] > 0 && box[2] < size.x && !taken.some((t) => t[0] < box[2] && box[0] < t[2] && t[1] < box[3] && box[1] < t[3]);
  for (const { p, m, pt } of all) {
    const w = Math.min(150, p.name.length * 6.2) + 2, right = [pt.x + 15, pt.y - 8, pt.x + 15 + w, pt.y + 8], left = [pt.x - 15 - w, pt.y - 8, pt.x - 15, pt.y + 8];
    const box = pt.y > 8 && pt.y < size.y - 8 ? [right, left].find(free) : null; // to the right, as in the art; to the left at the screen's edge
    if (box) taken.push(box);
    m.getElement()?.classList.toggle("named", !!box);
    m.getElement()?.classList.toggle("left", box === left);
  }
}
// You: the onboarding art's green circle, with a white arrow pointing where you're walking (the phone's heading,
// or your last two positions), or a white dot while standing still or when the direction isn't known.
let me = null;
const meIcon = () => L.divIcon({ className: "me-dot", iconSize: [34, 34],
  html: here.heading == null ? '<i class="still"></i>' : `<svg viewBox="0 0 34 34" style="transform:rotate(${Math.round(here.heading)}deg)"><path d="M17 8.5 L24 25 L17 21 L10 25 Z"/></svg>` });
function moveMe() { if (me && here.at && map?.hasLayer(me)) { me.setLatLng([here.at.lat, here.at.lng]); me.setIcon(meIcon()); } }
function headingFrom(pos, before) {
  const { heading, speed } = pos.coords;
  if (speed != null && speed < 0.5) return null; // standing still
  if (heading != null && !Number.isNaN(heading)) return heading;
  if (!before || meters(before, here.at) < 8) return here.heading ?? null; // GPS jitter: keep the last direction
  const r = Math.PI / 180, y = Math.sin((here.at.lng - before.lng) * r) * Math.cos(here.at.lat * r);
  const x = Math.cos(before.lat * r) * Math.sin(here.at.lat * r) - Math.sin(before.lat * r) * Math.cos(here.at.lat * r) * Math.cos((here.at.lng - before.lng) * r);
  return (Math.atan2(y, x) / r + 360) % 360;
}

// The drive to the nearest hospital, saved for no signal (OpenStreetMap car router). Once per 1.5 km move, online only.
async function keepHospitalDrive() {
  const d = savedHospitalDrive();
  if (!here.at || !navigator.onLine || (d && meters({ lat: d.from[0], lng: d.from[1] }, here.at) < 1500)) return;
  // (if the router is down nothing is saved, and driveHere() keeps ignoring any drive worked out elsewhere)
  const near = here.places.filter((p) => p.kind === "hospital").map((p) => ({ ...p, airM: meters(here.at, p) })).sort((a, b) => a.airM - b.airM);
  const list = near.length ? near : await hospitalsAround(here.at, 30000);
  if (list?.length) await saveHospitalDrive(here.at, list);
}
const hospitalLine = () => { const d = driveHere(); return d ? `The nearest hospital is ${driveText(d)}; the drive is saved on this phone.` : ""; };

// Follows your position. The first fix (and any move of more than 1.5 km) loads places to get help around you.
let watching = false;
function watchGps() {
  if (!navigator.geolocation || watching) return;
  watching = true;
  navigator.geolocation.watchPosition(async (pos) => {
    const first = !here.at, before = here.at;
    here.at = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    here.heading = headingFrom(pos, before); moveMe();
    recordTrail(here.at); watchAlerts();
    if (first || meters(before, here.at) > 20000) arriveAt(here.at, refreshScan).then(keepZones); // landed somewhere new: work out the city, research its scams
    else keepZones();
    if ($(".sheet") && first) home(); // the map jumps to you at once, without waiting for places (Overpass can be slow)
    if (first || !saved() || meters(saved().center, here.at) > 1500) { here.places = await placesAround(here.at); keepHospitalDrive(); }
    if ($(".sheet") && first) home(); // redraw Home once more with the places; later moves only move your dot (moveMe)
  }, (err) => { if (err.code === 1) { here.denied = true; if ($(".sheet")) home(); } }, { enableHighAccuracy: true, maximumAge: 15000 });
}

// Red zones from police data (unsafezones.js), drawn only within a 30-minute walk of her or on her saved routes.
// Fetched once per ~2 km while online; redrawn when she has moved 200 m. They never text anyone.
let zoneLayer = null, zonesAt = null, zoneWay = null;
function policeZones() {
  const at = where(), trip = savedTrip(), seen = new Set();
  const pts = [at && [at.lat, at.lng], trip?.home, trip?.place?.at].filter(Boolean);
  return pts.flatMap((p) => zonesAround(p)).filter((z) => !seen.has(z.id) && seen.add(z.id));
}
function shownAreas() {
  const at = where(), trip = savedTrip();
  const lines = [trip?.there?.path, trip?.back?.path, zoneWay?.route?.path].filter(Boolean);
  return [...areasNow(city.name), ...zonesToShow(policeZones(), at && [at.lat, at.lng], { graph: tripGraph(), lines })];
}
function redrawZones() { if (!map || !window.L || !$("#map")) return; zoneLayer?.remove(); zoneLayer = drawAreas(map, shownAreas()); zonesAt = where(); }
function keepZones() {
  const at = where();
  if (!at) return;
  if (!zonesAt || meters(zonesAt, at) > 200) redrawZones();
  loadZones([at.lat, at.lng], city.countryCode).then((fresh) => { if (fresh) { rerouteTrip(); redrawZones(); } });
}
// Under the way back: red zones from police data it passes or goes around, and quiet stretches (amber).
function routeNotes(w) {
  if (!w?.route) return "";
  const zones = zoneLine(w.route, w.fastest, policeZones()), quiet = quietNote(w.route);
  return `${zones ? `<p class="small">${esc(zones)}</p>` : ""}${quiet ? `<p class="small note-amber">${esc(quiet)}</p>` : ""}`;
}

// Texts her people by itself when she walks into an area marked dangerous (once per area an hour),
// or stops for 5+ minutes on the way back from a trip (once per stop).
let insideAreas = new Set(), stillTexted = false;
const lastDangerText = {};
function watchAlerts() {
  if (!here.at || !store.contacts.length) return;
  const at = [here.at.lat, here.at.lng], now = Date.now();
  // Only Beacon's reviewed list and her own marks text anyone; red zones from police data never do (alerts.js).
  const d = dangerTexts(at, areasNow(city.name), insideAreas, lastDangerText, now);
  insideAreas = d.inside;
  for (const a of d.text) sendText("danger", { place: a.name, lat: here.at.lat, lng: here.at.lng, police: police() });
  const minutes = stoppedMinutes(trail(), now);
  if (minutes < 5) stillTexted = false;
  else if (shouldTextStill({ trip: savedTrip(), at, minutes, now, textedThisStop: stillTexted })) {
    stillTexted = true;
    sendText("still", { minutes, lat: here.at.lat, lng: here.at.lng, police: police() });
  }
}

// ---------- Ask Beacon: answers from what's saved (numbers, nearby places, reported scams) ----------
function facts() {
  const near = where() ? ["police", "hospital", "pharmacy"].map((k) => nearest(here.places, where(), [k])).filter(Boolean) : [];
  const n = numbers();
  return `Where: ${city.name ? `${city.name}, ${city.country}` : "not known yet"}.
Emergency: police ${n.police}, ambulance ${n.ambulance}.${n.known ? "" : " (112 works from most mobile phones; this country's own numbers aren't saved.)"}
${hospitalLine() ? `Drive to the nearest hospital: ${hospitalLine()}\n` : ""}Closest places to get help:
${near.map((p) => `- ${p.name} (${KIND_LABEL[p.kind]}), ${dist(p.meters)} away, open 24 hours`).join("\n") || "- (none saved yet)"}
Scams travelers report here:
${scamsHere().map((s) => `- ${s.title} (${s.where}): ${s.whatHappens || ""} ${s.whatToDo}`).join("\n")}`;
}

function plainAnswer(question) {
  const q = question.toLowerCase(), place = helpPlace();
  const pharmacy = where() && nearest(here.places, where(), ["pharmacy"]), hospital = where() && nearest(here.places, where(), ["hospital"]);
  const n = numbers();
  if (/follow|unsafe|scared|danger/.test(q)) return `Go into a busy shop, hotel lobby or restaurant now and stay where people are.${place ? ` ${place.name} is ${dist(place.meters)} away.` : ""} If you're in danger, call ${n.police}.`;
  if (/hurt|hospital|doctor|bleed|sick/.test(q)) return `If it's serious, call ${n.ambulance} for an ambulance now.${driveHere() ? ` ${hospitalLine()}` : hospital ? ` The nearest hospital is ${hospital.name}, ${dist(hospital.meters)} away.` : ""}`;
  if (/pharmac|medicine|drug ?store/.test(q)) return pharmacy ? `${pharmacy.name} is ${dist(pharmacy.meters)} away and open 24 hours.` : "I don't have a 24-hour pharmacy saved near you.";
  const scam = judge({ kind: "Other", text: q }, scamsHere());
  if (scam.warning) return `${scam.warning.title} is a known scam (${scam.warning.where}). ${scam.whatToDo}`;
  if (recommends(question)) return place ? `${place.name} is ${dist(place.meters)} away and open 24 hours. Walk there on a busy, lit street. In an emergency, call ${n.police}.` : `Call ${n.police} in an emergency. Go online once so I can save places near you.`;
  if (/police|number|emergency|call/.test(q)) return `Police: ${n.police}. Ambulance: ${n.ambulance}.`;
  return `I don't have that saved. In an emergency, call ${n.police}.`;
}

const chat = []; // [{you, text, place}]
function ask(question) {
  let thinking = false;
  const draw = () => {
    panel().innerHTML = `<div class="screen" style="gap:0;padding-top:12px">
      <div class="chat-top"><button class="back" id="back" aria-label="Back">${icon.back}</button><h2>Ask Beacon</h2></div>
      <div class="bubbles" id="bubbles">
        ${chat.map((l) => `<div class="bubble ${l.you ? "you" : "beacon"}">${esc(l.text)}</div>${l.place ? `<button class="link left show" data-place="${esc(l.place)}">Show ${esc(l.place)} on the map</button>` : ""}${l.way ? `<button class="link left show" data-way="1">Show the way back on the map</button>` : ""}${l.drive ? `<button class="link left show" data-drive="1">Show the drive to the hospital</button>${navigator.onLine && here.at ? `<a class="link left show" target="_blank" rel="noopener" href="${googleMapsLink([here.at.lat, here.at.lng], driveHere().at)}">Drive there in Google Maps</a>` : ""}` : ""}`).join("")}
        ${thinking ? '<div class="bubble beacon">…</div>' : ""}
        ${chat.length || thinking ? "" : `<div class="stack center">${["Where can I get help?", "Is a ticket seller in Battery Park legit?", "What's the emergency number?"].map((q) => `<button class="chip label" data-q="${q}">${q}</button>`).join("")}</div>`}
      </div>
      <form class="askbar" id="form"><input id="box" placeholder="Ask Beacon anything" autocomplete="off" aria-label="Your question"><button class="sq" aria-label="Send">${icon.arrow}</button></form>
    </div>`;
    $("#back").onclick = () => home();
    $("#form").onsubmit = (e) => { e.preventDefault(); send($("#box").value); };
    app.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => send(b.dataset.q)));
    // On desktop the map is beside the chat: ring the place there and stay in the chat.
    app.querySelectorAll("[data-place]").forEach((b) => (b.onclick = () => { const p = here.places.find((x) => x.name === b.dataset.place); if (p && $(":scope > .side") && $("#map")) drawMap(p); else home(b.dataset.place); }));
    app.querySelectorAll("[data-drive]").forEach((b) => (b.onclick = () => { const d = driveHere(); if (!d) return; home(null, { route: { path: d.line, steps: [], metres: Math.round(d.km * 1000), minutes: d.minutes }, drive: d }); }));
    app.querySelectorAll("[data-way]").forEach((b) => (b.onclick = () => home(null, where() ? wayBack([where().lat, where().lng]) : null)));
    const bubbles = $("#bubbles"); bubbles.scrollTop = bubbles.scrollHeight;
  };
  const send = async (text) => {
    text = text.trim();
    if (!text || thinking) return;
    const pick = recommends(text) ? helpPlace() : null;
    chat.push({ you: true, text }); thinking = true; draw();
    const said = (reply, extra = {}) => { chat.push({ you: false, text: reply, ...extra }); thinking = false; draw(); };
    // "Way back to my hotel": from the saved trip, with no network.
    if (/way back|back to (my |the )?(hotel|start)|get back/i.test(text) && savedTrip()) {
      if (!where()) return said("Turn on location so Beacon knows where you are.");
      const w = wayBack([where().lat, where().lng]);
      return said(wayText(w), { way: !!w?.route || !!w?.partial });
    }
    if (/going out tonight/i.test(text)) return said("Where are you going? Tell me the place, like \"I'm going to Bar Palladio, then back to my hotel\".");
    // "Tonight I'm going to X": save the streets, areas and both routes while online.
    // Help comes first: only clear plans ("tonight I'm going to X, then back") become a saved trip.
    const goingTo = isPlanning(text) ? placeFromPlan(text) : null;
    if (goingTo) {
      if (!where()) return said("Turn on location first, so Beacon can save the streets around you.");
      if (!navigator.onLine) return said("Beacon needs a connection once to save the way there and back. Ask again when you're online.");
      chat.push({ you: false, text: `Finding ${goingTo}…` }); draw();
      const step = (t) => { chat[chat.length - 1].text = t; draw(); };
      const place = await findPlace(goingTo, [where().lat, where().lng], city.name);
      if (!place) { chat.pop(); return said(`I couldn't find ${goingTo} on the map. Try its full name.`); }
      const trip = await planTrip({ from: [where().lat, where().lng], hotel: savedHotel(), place, city: city.name, countryCode: city.countryCode }, step);
      chat.pop();
      if (trip.error) return said(trip.error === "streets" ? "The map servers are busy. Try again in a minute; nothing was saved yet." : "I couldn't save a walking route for that trip. Try a place nearer by.");
      return said(`Saved for no signal: the way to ${place.name} and back. Back: ${dist(trip.back.metres)}, ${trip.back.minutes} min on busy, lit streets.`, { way: true });
    }
    const earlier = chat.slice(-5, -1).map((l) => `${l.you ? "Traveler" : "Beacon"}: ${l.text}`).join("\n") || "(nothing yet)";
    const reply = (await askAi(`You are Beacon, a calm safety helper for a traveler${inCity()}. Answer using ONLY the facts below. Copy names and numbers exactly.
If the facts don't cover it, say "I don't have that saved. In an emergency, call ${police()}." At most 3 short steps, plain words.${pick ? `\nRecommend ${pick.name} first.` : ""}
FACTS
${facts()}
EARLIER
${earlier}
QUESTION: ${text}`))?.text ?? plainAnswer(text);
    said(reply, { place: pick?.name || null, drive: /hurt|hospital|doctor|bleed|sick|ambulance/i.test(text) && !!driveHere() });
  };
  draw();
  if (question) send(question);
}

// ---------- SOS: a few words in, a clear message out, sent from your messages app ----------
function sos(note = "", draft = "") {
  const people = store.contacts;
  app.innerHTML = `<div class="screen focus">
    <button class="back-inline" id="back" aria-label="Back">${icon.back}</button>
    <h1>What's happening?</h1>
    <textarea class="field" id="note" placeholder="A few words are enough">${esc(note)}</textarea>
    <div class="chips">${["Being followed", "Feel unsafe", "Hurt", "Lost", "Robbed"].map((q) => `<button class="chip" data-pick="${q}">${q}</button>`).join("")}</div>
    <p class="error" id="error"></p>
    ${draft ? `<div class="stack"><div class="label">Message to ${esc(joinNames(people.map((c) => c.name)))}</div><textarea class="field" id="draft" style="height:150px">${esc(draft)}</textarea></div>` : ""}
    <div class="grow"></div>
    ${draft ? `<button class="btn red" id="send">Send to ${esc(joinNames(people.map((c) => c.name)))}</button>` : `<button class="btn" id="write">Write the message</button>`}
    <a class="link center-self" href="tel:${police()}">Call ${police()} instead</a>
  </div>`;
  const noteBox = $("#note");
  $("#back").onclick = () => home();
  app.querySelectorAll("[data-pick]").forEach((b) => (b.onclick = () => { noteBox.value = noteBox.value.trim() ? `${noteBox.value.trim()}, ${b.dataset.pick.toLowerCase()}` : b.dataset.pick; }));
  if (!draft) {
    $("#write").onclick = async () => {
      const text = noteBox.value.trim();
      if (!text) return ($("#error").textContent = "Type or tap what's happening first.");
      $("#write").disabled = true; $("#write").textContent = "Writing…";
      const who = store.name || "Your contact";
      const map = here.at ? `\nWhere: https://maps.google.com/?q=${here.at.lat.toFixed(5)},${here.at.lng.toFixed(5)}` : "";
      const ai = await askAi(`Rewrite this emergency note into a clear SOS text message for family. Max 50 words. Third person about ${who}${inCity()}.
Keep every fact; add none. End with: "Call ${who} now. If there is no answer, call ${police()}."
Note: "${text}"`);
      sos(text, (ai?.text ?? `${who} needs help${inCity()}: ${text}. Call ${who} now. If there is no answer, call ${police()}.`) + map);
    };
  } else {
    // Sent by Beacon itself (a text message from Beacon's number). With no signal it waits and goes when it can.
    $("#send").onclick = async () => {
      $("#send").disabled = true; $("#send").textContent = "Sending…";
      const text = $("#draft").value, message = text.replace(/\s*Where: https?:\/\/\S+/g, "").trim();
      const status = await sendText("sos", { message, lat: here.at?.lat, lng: here.at?.lng });
      sent(status, smsLink(people.map((c) => c.phone), text));
    };
  }
}

function sent(status = "sent", fallback = "") {
  const place = helpPlace(), who = joinNames(store.contacts.map((c) => c.name));
  app.innerHTML = `<div class="screen center focus" style="text-align:center">
    <h1>${status === "sent" ? `${esc(who)} got your SOS` : "Your SOS is waiting for signal"}</h1>
    <p class="small">${status === "sent" ? "Beacon texted them your message and where you are." : "Beacon sends it by itself as soon as there's a connection. A normal text may get through sooner:"}</p>
    ${status === "sent" ? "" : `<a class="btn quiet" href="${esc(fallback)}" style="display:grid;place-items:center;text-decoration:none">Send from my messages instead</a>`}
    <a class="btn red" href="tel:${police()}" style="display:grid;place-items:center;text-decoration:none">Call ${police()}</a>
    ${place ? `<button class="outline" id="go" style="width:100%;text-align:left"><i class="dot big" style="background:${KIND_COLOR[place.kind]}"></i><div><div class="label">Walk to ${esc(place.name)}</div><p class="small">${dist(place.meters)}, open 24 hours</p></div></button>` : ""}
    <div class="grow"></div><button class="link" id="back">Back to the map</button></div>`;
  $("#go")?.addEventListener("click", () => home(place.name));
  $("#back").onclick = () => home();
}

// Redraws the scan screen when the city or its saved scams change while it's open.
function refreshScan() { if (app.querySelector("h1")?.textContent === "Is this legit?" && app.querySelector("#photo")) openScan(); }

// ---------- Start ----------
if (new URLSearchParams(location.search).has("reset")) store.reset();
loadVectorMap(); // starts fetching the map library while the first screen shows
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
const devAt = ["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).get("at");
if (devAt) { const [lat, lng] = devAt.split(",").map(Number); here.at = { lat, lng }; recordTrail(here.at); arriveAt(here.at, refreshScan).then(keepZones); placesAround(here.at).then((p) => { here.places = p; if ($(".sheet")) home(); }); }
else if (store.setupDone) watchGps(); // new users are asked on the onboarding's location screen
research(refreshScan); // the city from your last visit, if there was one; a new position starts it again
// Until the phone says where you are, show places around the last saved spot (if any). Never a made-up city.
if (!here.places.length && saved()?.center) placesAround(saved().center).then((p) => { if (here.places.length) return; here.places = p; if ($(".sheet")) home(); });
// Answers "how is she?" while Beacon is open, once her people have their link.
function answer() { if (store.trip) startAnswering(() => ({ city: city.name, areas: areasNow(city.name), wayBack: (at) => wayBack(at) })); }
answer();
const counts = () => {
  const k = (kind) => here.places.filter((p) => p.kind === kind && (kind !== "pharmacy" || p.open24h)).length;
  const h = where() && nearest(here.places, where(), ["hospital"]);
  return { hospitals: k("hospital"), police: k("police"), pharmacies: k("pharmacy"), scams: scamsHere().length, researching: city.researching,
    nearestHospital: h ? `${h.name}, ${dist(h.meters)}` : "", placesDone: !!here.places.length || (!!where() && !city.researching) };
};
const onPosition = async (pos) => {
  here.at = { lat: pos.coords.latitude, lng: pos.coords.longitude }; recordTrail(here.at);
  arriveAt(here.at, refreshScan); here.places = await placesAround(here.at); keepHospitalDrive();
};
if (store.setupDone && store.contacts.length) home();
else onboarding(app, { city: () => ({ name: city.name, country: city.country }), counts, onPosition, done: () => { store.setupDone = true; watchGps(); answer(); home(); } });
