// Beacon New York: the same app as the Lapa demo, on a real street map, wherever you are.
// Screens: setup -> home -> (ask | scan | sos -> sent). Each builds its HTML into #app and wires its buttons.
// Works offline once opened: the page is saved by sw.js, nearby places are saved in the browser,
// and Ask, Scan and SOS need no signal. The map's street tiles need a connection (the tile provider doesn't allow saving them).
import { store, cleanPhone, joinNames } from "../../js/store.js";
import { askAi } from "../../js/ai.js";
import { scanScreen } from "./scan.js";
import { recommends, judge } from "../../js/scams.js";
import { smsLink } from "../../js/sos.js";
import { ny } from "./nypack.js";
import { placesAround, nearest, saved, meters } from "./places.js";
import { city, scamsHere, savedAt, arriveAt, research } from "./city.js";

const app = document.getElementById("app");
const $ = (s) => app.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TIMES_SQUARE = { lat: 40.758, lng: -73.9855 };
const here = { at: null, places: saved()?.places || [] }; // at = your real GPS position, null until the phone gives it
const where = () => here.at || TIMES_SQUARE;
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
const helpPlace = () => nearest(here.places, where(), ["police", "hospital"]) || nearest(here.places, where());

// ---------- Setup: your name and who gets your SOS ----------
function setup() {
  app.innerHTML = `<div class="screen">
    <h1>Beacon for New York</h1>
    <p>If something goes wrong, Beacon writes a clear message for the people you trust, with where you are. Point the camera at a deal or a stranger's offer and it tells you if travelers report it as a scam.</p>
    <input class="field" id="name" placeholder="Your first name" value="${esc(store.name)}" autocomplete="given-name">
    <div class="label">Who should hear from you?</div>
    ${store.contacts.map((c, i) => `<div class="card"><div class="grow"><div class="label">${esc(c.name)}</div><p class="small">${esc(c.phone)}</p></div><button class="link small" data-del="${i}">Remove</button></div>`).join("")}
    <input class="field" id="cname" placeholder="Name (Mom, a friend…)">
    <input class="field" id="cphone" placeholder="Phone with country code, +1 212 555 0100" inputmode="tel">
    <p class="error" id="error"></p>
    <button class="link left" id="add">Add this person</button>
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
  app.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => { store.removeContact(+b.dataset.del); setup(); }));
  $("#done").onclick = () => {
    if (!add()) return;
    if (!store.contacts.length) return ($("#error").textContent = "Add at least one person to get your SOS.");
    store.name = $("#name").value; store.setupDone = true; home();
  };
}

// ---------- Home: the map, Ask Beacon, the nearest place to get help, Scan, SOS ----------
let map = null;
function home(highlight = null) {
  const shown = here.places.find((p) => p.name === highlight) || null;
  const card = shown ? { ...shown, meters: meters(where(), shown) } : helpPlace();
  app.innerHTML = `
    <div class="mapwrap" style="min-height:320px"><div id="map"></div>
      ${here.at ? "" : '<div class="hint small">Finding where you are…</div>'}</div>
    <div class="sheet"><div class="grab"></div>
      <button class="askbar" id="ask"><span>Ask Beacon anything</span><i class="sq">${icon.arrow}</i></button>
      <div class="chips">${["Where can I get help?", "I think I'm being followed"].map((q) => `<button class="chip" data-q="${q}">${q}</button>`).join("")}</div>
      ${card ? `<button class="card" id="place"><i class="dot big" style="background:${KIND_COLOR[card.kind]}"></i><div><div class="label">${esc(card.name)} · ${dist(card.meters)}</div><p class="small">${KIND_LABEL[card.kind]} · open 24 hours</p></div></button>`
             : `<div class="card"><p class="small">${navigator.onLine ? "Looking for police stations and hospitals near you…" : "Go online once to save places near you."}</p></div>`}
      <div class="two"><a id="ok" href="#">${icon.check}I'm OK</a><button id="scan">${icon.camera}Scan</button><a href="tel:911">${icon.phone}911</a></div>
      <button class="btn red" id="sos">SOS</button>
      <div class="foot small"><span>Goes to ${esc(joinNames(store.contacts.map((c) => c.name)))}</span><button class="link small" id="edit">Edit</button></div>
    </div>`;
  drawMap(shown);
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
  return at ? `Updated from the web ${new Date(at).toLocaleDateString([], { month: "short", day: "numeric" })}. Works with no signal.` : "Saved on this phone. Works with no signal.";
}
function openScan() {
  scanScreen(app, { back: () => home(), backIcon: icon.back, city: city.name, scams: scamsHere(), status: scanStatus() });
}

// The street map (OpenStreetMap through Leaflet): you as a green dot, places to get help, and a yellow ring
// that blinks around a recommended place (`shown`) and then stays until you tap the map.
function drawMap(shown) {
  if (!window.L) { $("#map").innerHTML = '<p class="small" style="padding:16px">The map needs a connection. Everything else works offline.</p>'; return; }
  map?.remove();
  map = L.map($("#map"), { zoomControl: false, attributionControl: true }).setView(shown ? [(where().lat + shown.lat) / 2, (where().lng + shown.lng) / 2] : [where().lat, where().lng], 16);
  // OpenStreetMap tiles, tinted light grey in ny.css to look like Beacon's drawn map. Credit required.
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
  for (const p of here.places) {
    if (!p.open24h) continue;
    L.circleMarker([p.lat, p.lng], { radius: 7, color: "#fff", weight: 2, fillColor: KIND_COLOR[p.kind], fillOpacity: 1 }).bindTooltip(esc(p.name)).addTo(map); // OSM names are outside data: escaped
  }
  if (shown) {
    L.circleMarker([shown.lat, shown.lng], { radius: 20, className: "go-here" }).addTo(map);
    map.once("click", () => home());
  }
  if (here.at) {
    L.circleMarker([here.at.lat, here.at.lng], { radius: 16, stroke: false, fillColor: "#22A06B", fillOpacity: 0.18 }).addTo(map);
    L.circleMarker([here.at.lat, here.at.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#22A06B", fillOpacity: 1 }).addTo(map);
  }
}

// Follows your position. The first fix (and any move of more than 1.5 km) loads places to get help around you.
function watchGps() {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition(async (pos) => {
    const first = !here.at, before = here.at;
    here.at = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    if (first || meters(before, here.at) > 20000) arriveAt(here.at, refreshScan); // landed somewhere new: work out the city, research its scams
    if (first || !saved() || meters(saved().center, here.at) > 1500) here.places = await placesAround(here.at);
    if ($(".sheet") && first) home(); // redraw Home once with your real position; later moves don't reset the screen
  }, () => {}, { enableHighAccuracy: true, maximumAge: 15000 });
}

// ---------- Ask Beacon: answers from what's saved (numbers, nearby places, reported scams) ----------
function facts() {
  const near = ["police", "hospital", "pharmacy"].map((k) => nearest(here.places, where(), [k])).filter(Boolean);
  return `Emergency (police, fire, ambulance): ${ny.police}. Non-emergency city help: ${ny.nonEmergency}.
Closest places to get help:
${near.map((p) => `- ${p.name} (${KIND_LABEL[p.kind]}), ${dist(p.meters)} away, open 24 hours`).join("\n") || "- (none saved yet)"}
Scams travelers report in ${city.name}:
${scamsHere().map((s) => `- ${s.title} (${s.where}): ${s.whatHappens || ""} ${s.whatToDo}`).join("\n")}`;
}

function plainAnswer(question) {
  const q = question.toLowerCase(), place = helpPlace();
  const pharmacy = nearest(here.places, where(), ["pharmacy"]), hospital = nearest(here.places, where(), ["hospital"]);
  if (/follow|unsafe|scared|danger/.test(q)) return `Go into a busy shop, hotel lobby or restaurant now and stay where people are.${place ? ` ${place.name} is ${dist(place.meters)} away.` : ""} If you're in danger, call 911.`;
  if (/hurt|hospital|doctor|bleed|sick/.test(q)) return `If it's serious, call 911.${hospital ? ` The nearest hospital is ${hospital.name}, ${dist(hospital.meters)} away.` : ""}`;
  if (/pharmac|medicine|drug ?store/.test(q)) return pharmacy ? `${pharmacy.name} is ${dist(pharmacy.meters)} away and open 24 hours.` : "I don't have a 24-hour pharmacy saved near you.";
  const scam = judge({ kind: "Other", text: q }, scamsHere());
  if (scam.warning) return `${scam.warning.title} is a known scam (${scam.warning.where}). ${scam.whatToDo}`;
  if (recommends(question)) return place ? `${place.name} is ${dist(place.meters)} away and open 24 hours. Walk there on a busy, lit street. In an emergency, call 911.` : "Call 911 in an emergency. Go online once so I can save places near you.";
  if (/police|number|emergency|call/.test(q)) return `Emergency (police, fire, ambulance): 911. For non-emergencies, call 311.`;
  return "I don't have that saved. In an emergency, call 911.";
}

const chat = []; // [{you, text, place}]
function ask(question) {
  let thinking = false;
  const draw = () => {
    app.innerHTML = `<div class="screen" style="gap:0;padding-top:12px">
      <div class="chat-top"><button class="back" id="back" aria-label="Back">${icon.back}</button><h2>Ask Beacon</h2></div>
      <div class="bubbles" id="bubbles">
        ${chat.map((l) => `<div class="bubble ${l.you ? "you" : "beacon"}">${esc(l.text)}</div>${l.place ? `<button class="link left show" data-place="${esc(l.place)}">Show ${esc(l.place)} on the map</button>` : ""}`).join("")}
        ${thinking ? '<div class="bubble beacon">…</div>' : ""}
        ${chat.length || thinking ? "" : `<div class="stack center">${["Where can I get help?", "Is a ticket seller in Battery Park legit?", "What's the emergency number?"].map((q) => `<button class="chip label" data-q="${q}">${q}</button>`).join("")}</div>`}
      </div>
      <form class="askbar" id="form"><input id="box" placeholder="Ask Beacon anything" autocomplete="off" aria-label="Your question"><button class="sq" aria-label="Send">${icon.arrow}</button></form>
    </div>`;
    $("#back").onclick = () => home();
    $("#form").onsubmit = (e) => { e.preventDefault(); send($("#box").value); };
    app.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => send(b.dataset.q)));
    app.querySelectorAll("[data-place]").forEach((b) => (b.onclick = () => home(b.dataset.place)));
    const bubbles = $("#bubbles"); bubbles.scrollTop = bubbles.scrollHeight;
  };
  const send = async (text) => {
    text = text.trim();
    if (!text || thinking) return;
    const pick = recommends(text) ? helpPlace() : null;
    chat.push({ you: true, text }); thinking = true; draw();
    const earlier = chat.slice(-5, -1).map((l) => `${l.you ? "Traveler" : "Beacon"}: ${l.text}`).join("\n") || "(nothing yet)";
    const reply = (await askAi(`You are Beacon, a calm safety helper for a traveler in ${city.name}. Answer using ONLY the facts below. Copy names and numbers exactly.
If the facts don't cover it, say "I don't have that saved. In an emergency, call 911." At most 3 short steps, plain words.${pick ? `\nRecommend ${pick.name} first.` : ""}
FACTS
${facts()}
EARLIER
${earlier}
QUESTION: ${text}`)) ?? plainAnswer(text);
    chat.push({ you: false, text: reply, place: pick?.name || null }); thinking = false; draw();
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
    <a class="link center-self" href="tel:911">Call 911 instead</a>
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
      const ai = await askAi(`Rewrite this emergency note into a clear SOS text message for family. Max 50 words. Third person about ${who}, in New York.
Keep every fact; add none. End with: "Call ${who} now. If there is no answer, call 911."
Note: "${text}"`);
      sos(text, (ai ?? `${who} needs help in New York: ${text}. Call ${who} now. If there is no answer, call 911.`) + map);
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
    <a class="btn red" href="tel:911" style="display:grid;place-items:center;text-decoration:none">Call 911</a>
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
watchGps();
research(refreshScan); // New York until the phone says where you are
// Until the phone says where you are, show places around Times Square (or the last saved spot).
if (!here.places.length) placesAround(saved()?.center || TIMES_SQUARE).then((p) => { if (here.places.length) return; here.places = p; if ($(".sheet")) home(); });
store.setupDone && store.contacts.length ? home() : setup();
