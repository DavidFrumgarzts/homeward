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
import { savedTrip, planTrip, wayBack, findPlace, addMyArea, areasNow } from "./trips.js";
import { drawExtras } from "./routemap.js";
import { recordTrail, startAnswering, checkinLink, answersSent, paused, setPaused } from "./answering.js";
import { onboarding } from "./onboard.js";
import { hospitalsAround, saveHospitalDrive, savedHospitalDrive } from "./drive.js";
import { driveText, googleMapsLink } from "../../js/trip.js";
import { placeFromPlan, placePrompt, readPlace } from "../../js/trip.js";

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
const icon = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#22A06B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="#E5484D" stroke-width="2" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>',
};
const savedHotel = () => { try { return JSON.parse(localStorage.getItem("beacon.booking"))?.at || null; } catch { return null; } };
const homeName = () => (savedTrip()?.homeIsHotel || savedHotel() ? "your hotel" : "where you started");
const compassWord = { N: "north", NE: "north-east", E: "east", SE: "south-east", S: "south", SW: "south-west", W: "west", NW: "north-west" };
// The way back as words: "2.9 km · 36 min on busy, lit streets" or, off the saved streets, direction and distance.
function wayText(w) {
  if (!w) return "";
  if (w.arrived) return `You're at ${homeName()}.`;
  if (w.partial) return `You're outside the streets Beacon saved. ${homeName()[0].toUpperCase() + homeName().slice(1)} is ${dist(w.direction.metres)} to the ${compassWord[w.direction.compass]}. This is a direction, not a full route.`;
  const r = w.route, f = w.fastest, extra = f && r.minutes > f.minutes ? ` ${r.minutes - f.minutes} min longer than the fastest way, and it stays on busier streets.` : "";
  return `${dist(r.metres)} · ${r.minutes} min on busy, lit streets.${extra}${r.dangerMetres ? "" : f?.dangerMetres ? " It goes around the areas to avoid." : ""}`;
}
let avoiding = null; // corners tapped while marking an area to avoid
const helpPlace = () => (where() ? nearest(here.places, where(), ["police", "hospital"]) || nearest(here.places, where()) : null);

// ---------- Setup: your name and who gets your SOS ----------
function setup() {
  app.innerHTML = `<div class="screen">
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
      <a class="btn quiet" id="sendlink" href="#">Send them their check-in link</a>
      <label class="row small"><input type="checkbox" id="pause" ${paused() ? "checked" : ""}> Pause answers for now</label>
      ${answersSent().slice(0, 5).map((a) => `<p class="small">${esc(a.who)} asked at ${new Date(a.askedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Beacon answered</p>`).join("")}</div>` : ""}
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
  $("#sendlink")?.addEventListener("click", async (e) => {
    e.preventDefault(); store.name = $("#name").value;
    const link = await checkinLink({ city: city.name, country: city.country });
    if (!link) return ($("#error").textContent = "Beacon needs a connection once to make the link.");
    location.href = smsLink(store.contacts.map((c) => c.phone), `${store.name || "I"} added you to Beacon. Open this to see how ${store.name || "I"} ${store.name ? "is" : "am"} any time: ${link}`);
    answer();
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
    <div class="sheet"><div class="grab"></div>
      <button class="askbar" id="ask"><span>Ask Beacon anything</span><i class="sq">${icon.arrow}</i></button>
      <div class="chips">${[savedTrip() ? (savedTrip().homeIsHotel ? "Way back to my hotel" : "Way back to where I started") : "I'm going out tonight", "Where can I get help?", "I think I'm being followed"].map((q) => `<button class="chip" data-q="${q}">${q}</button>`).join("")}</div>
      ${way?.drive ? `<div class="card route-card"><div class="label">Drive to ${esc(way.drive.name)}</div><p class="small">${esc(driveText(way.drive))} · saved for no signal · route © OpenStreetMap contributors</p></div>` : ""}
      ${way && !way.drive ? `<div class="card route-card"><div class="label">Back to ${homeName()}</div><p class="small">${esc(wayText(way))}</p>${way.route ? `<p class="small">${esc(way.route.steps.slice(0, 4).map((x) => `${x.name} ${dist(x.m)}`).join(" → "))}</p><p class="small">Saved for no signal · route © OpenStreetMap contributors</p>` : ""}</div>` : ""}
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
  scanScreen(app, { back: () => home(), backIcon: icon.back, city: city.name, scams: scamsHere(), status: scanStatus() });
}

// The street map (OpenStreetMap through Leaflet): you as a green dot, places to get help, and a yellow ring
// that blinks around a recommended place (`shown`) and then stays until you tap the map.
function drawMap(shown, way = null) {
  if (!window.L) { $("#map").innerHTML = '<p class="small" style="padding:16px">The map needs a connection. Everything else works offline.</p>'; return; }
  map?.remove();
  const at = where();
  map = L.map($("#map"), { zoomControl: false, attributionControl: true });
  if (!at) map.setView([25, 0], 2); // no position yet: the world, until the phone says where you are
  else map.setView(shown ? [(at.lat + shown.lat) / 2, (at.lng + shown.lng) / 2] : [at.lat, at.lng], 16);
  // OpenStreetMap tiles, tinted light grey in live.css to look like Beacon's drawn map. Credit required.
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
  for (const p of here.places) {
    if (!p.open24h) continue;
    L.circleMarker([p.lat, p.lng], { radius: 7, color: "#fff", weight: 2, fillColor: KIND_COLOR[p.kind], fillOpacity: 1 }).bindTooltip(esc(p.name)).addTo(map); // OSM names are outside data: escaped
  }
  if (shown) {
    L.circleMarker([shown.lat, shown.lng], { radius: 20, className: "go-here" }).addTo(map);
    if (!avoiding) map.once("click", () => home());
  }
  const trip = savedTrip(), hotel = savedHotel() || (trip?.homeIsHotel ? trip.home : null);
  drawExtras(map, { areas: areasNow(city.name), way, home: hotel, places: here.places, at: here.at });
  if (way?.route) map.fitBounds(L.latLngBounds(way.route.path).pad(0.15));
  if (avoiding) map.on("click", (e) => {
    avoiding.push([e.latlng.lat, e.latlng.lng]);
    if (avoiding.length < 4) { $("#avoid").textContent = `Tap corner ${avoiding.length + 1} of 4`; L.circleMarker(e.latlng, { radius: 4, color: "#E5484D" }).addTo(map); return; }
    addMyArea(avoiding); avoiding = null; home(null, savedTrip() && where() ? wayBack([where().lat, where().lng]) : null);
  });
  if (here.at) {
    L.circleMarker([here.at.lat, here.at.lng], { radius: 16, stroke: false, fillColor: "#22A06B", fillOpacity: 0.18 }).addTo(map);
    L.circleMarker([here.at.lat, here.at.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#22A06B", fillOpacity: 1 }).addTo(map);
  }
}

// The drive to the nearest hospital, saved for no signal (OpenStreetMap car router). Once per 1.5 km move, online only.
async function keepHospitalDrive() {
  const d = savedHospitalDrive();
  if (!here.at || !navigator.onLine || (d && meters({ lat: d.from[0], lng: d.from[1] }, here.at) < 1500)) return;
  const near = here.places.filter((p) => p.kind === "hospital").map((p) => ({ ...p, airM: meters(here.at, p) })).sort((a, b) => a.airM - b.airM);
  await saveHospitalDrive(here.at, near.length ? near : await hospitalsAround(here.at, 30000));
}
const hospitalLine = () => { const d = savedHospitalDrive(); return d ? `The nearest hospital is ${driveText(d)}; the drive is saved on this phone.` : ""; };

// Follows your position. The first fix (and any move of more than 1.5 km) loads places to get help around you.
let watching = false;
function watchGps() {
  if (!navigator.geolocation || watching) return;
  watching = true;
  navigator.geolocation.watchPosition(async (pos) => {
    const first = !here.at, before = here.at;
    here.at = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    recordTrail(here.at);
    if (first || meters(before, here.at) > 20000) arriveAt(here.at, refreshScan); // landed somewhere new: work out the city, research its scams
    if (first || !saved() || meters(saved().center, here.at) > 1500) { here.places = await placesAround(here.at); keepHospitalDrive(); }
    if ($(".sheet") && first) home(); // redraw Home once with your real position; later moves don't reset the screen
  }, (err) => { if (err.code === 1) { here.denied = true; if ($(".sheet")) home(); } }, { enableHighAccuracy: true, maximumAge: 15000 });
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
  if (/hurt|hospital|doctor|bleed|sick/.test(q)) return `If it's serious, call ${n.ambulance} for an ambulance now.${savedHospitalDrive() ? ` ${hospitalLine()}` : hospital ? ` The nearest hospital is ${hospital.name}, ${dist(hospital.meters)} away.` : ""}`;
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
    app.innerHTML = `<div class="screen" style="gap:0;padding-top:12px">
      <div class="chat-top"><button class="back" id="back" aria-label="Back">${icon.back}</button><h2>Ask Beacon</h2></div>
      <div class="bubbles" id="bubbles">
        ${chat.map((l) => `<div class="bubble ${l.you ? "you" : "beacon"}">${esc(l.text)}</div>${l.place ? `<button class="link left show" data-place="${esc(l.place)}">Show ${esc(l.place)} on the map</button>` : ""}${l.way ? `<button class="link left show" data-way="1">Show the way back on the map</button>` : ""}${l.drive ? `<button class="link left show" data-drive="1">Show the drive to the hospital</button>${navigator.onLine && here.at ? `<a class="link left show" target="_blank" rel="noopener" href="${googleMapsLink([here.at.lat, here.at.lng], savedHospitalDrive().at)}">Drive there in Google Maps</a>` : ""}` : ""}`).join("")}
        ${thinking ? '<div class="bubble beacon">…</div>' : ""}
        ${chat.length || thinking ? "" : `<div class="stack center">${["Where can I get help?", "Is a ticket seller in Battery Park legit?", "What's the emergency number?"].map((q) => `<button class="chip label" data-q="${q}">${q}</button>`).join("")}</div>`}
      </div>
      <form class="askbar" id="form"><input id="box" placeholder="Ask Beacon anything" autocomplete="off" aria-label="Your question"><button class="sq" aria-label="Send">${icon.arrow}</button></form>
    </div>`;
    $("#back").onclick = () => home();
    $("#form").onsubmit = (e) => { e.preventDefault(); send($("#box").value); };
    app.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => send(b.dataset.q)));
    app.querySelectorAll("[data-place]").forEach((b) => (b.onclick = () => home(b.dataset.place)));
    app.querySelectorAll("[data-drive]").forEach((b) => (b.onclick = () => { const d = savedHospitalDrive(); home(null, { route: { path: d.line, steps: [], metres: Math.round(d.km * 1000), minutes: d.minutes }, drive: d }); }));
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
    let goingTo = placeFromPlan(text);
    if (!goingTo && /\b(going|go|heading|visit)\b/i.test(text)) goingTo = readPlace((await askAi(placePrompt(text)))?.text);
    if (goingTo) {
      if (!where()) return said("Turn on location first, so Beacon can save the streets around you.");
      if (!navigator.onLine) return said("Beacon needs a connection once to save the way there and back. Ask again when you're online.");
      chat.push({ you: false, text: `Finding ${goingTo}…` }); draw();
      const step = (t) => { chat[chat.length - 1].text = t; draw(); };
      const place = await findPlace(goingTo, [where().lat, where().lng], city.name);
      if (!place) { chat.pop(); return said(`I couldn't find ${goingTo} on the map. Try its full name.`); }
      const trip = await planTrip({ from: [where().lat, where().lng], hotel: savedHotel(), place, city: city.name }, step);
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
    said(reply, { place: pick?.name || null, drive: /hurt|hospital|doctor|bleed|sick|ambulance/i.test(text) && !!savedHospitalDrive() });
  };
  draw();
  if (question) send(question);
}

// ---------- SOS: a few words in, a clear message out, sent from your messages app ----------
function sos(note = "", draft = "") {
  const people = store.contacts;
  app.innerHTML = `<div class="screen">
    <button class="back-inline" id="back" aria-label="Back">${icon.back}</button>
    <h1>What's happening?</h1>
    <textarea class="field" id="note" placeholder="A few words are enough">${esc(note)}</textarea>
    <div class="chips">${["Being followed", "Feel unsafe", "Hurt", "Lost", "Robbed"].map((q) => `<button class="chip" data-pick="${q}">${q}</button>`).join("")}</div>
    <p class="error" id="error"></p>
    ${draft ? `<div class="stack"><div class="label">Message to ${esc(joinNames(people.map((c) => c.name)))}</div><textarea class="field" id="draft" style="height:150px">${esc(draft)}</textarea></div>` : ""}
    <div class="grow"></div>
    ${draft ? `<a class="btn red" id="send" style="display:grid;place-items:center;text-decoration:none" href="#">Open messages to send</a>` : `<button class="btn" id="write">Write the message</button>`}
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
    const link = $("#send"), box = $("#draft");
    const refresh = () => (link.href = smsLink(people.map((c) => c.phone), box.value));
    box.oninput = refresh; refresh();
    link.onclick = () => setTimeout(sent, 300); // let the messages app open first
  }
}

function sent() {
  const place = helpPlace();
  app.innerHTML = `<div class="screen center" style="text-align:center">
    <h1>Press send in your messages app</h1>
    <p class="small">Beacon filled in the message. It goes when you press send there.</p>
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
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
const devAt = ["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).get("at");
if (devAt) { const [lat, lng] = devAt.split(",").map(Number); here.at = { lat, lng }; recordTrail(here.at); arriveAt(here.at, refreshScan); placesAround(here.at).then((p) => { here.places = p; if ($(".sheet")) home(); }); }
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
