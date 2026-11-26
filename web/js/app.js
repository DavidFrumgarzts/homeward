// Beacon web: decides which screen is showing and draws it.
// The traveler's screens, one function each, in the order a new user sees them:
//   story -> welcome -> contacts -> ready -> home -> (ask | sos -> sent)
// Each screen builds its HTML, puts it in #app, then wires up its buttons.
// Two more pages live at their own addresses (js/router.js): the family view (js/family.js) at
// /f/{shareId}, and the same view with a replayed, made-up incident at /demo.
import { store, cleanPhone, joinNames, shortPhone } from "./store.js";
import { pack, START, clock, nearestPlace, zoneCloseness, zoneRiskyAt } from "./pack.js";
import { mapSvg, dotSvg, badge, tapToSpot, gpsToSpot, headingBetween } from "./map.js";
import { copSvg } from "./cop.js";
import { answer } from "./ask.js";
import { aiReady, sourceLabel, warmUp } from "./ai.js";
import { writeSos, checkInText, smsLink, endedText } from "./sos.js";
import { esc, aiBadge } from "./html.js";
import { route } from "./router.js";
import { familyScreen } from "./family.js";
import { watchShare } from "./familydata.js";
import { watchDemo } from "./demo.js";
import { prepareIncident, saveIncident, endIncident, flushPending, resumeSync } from "./incident.js";
import { pickSituation } from "./situation.js";
import { scanScreen } from "./scan.js";
import { recommends } from "./scams.js";

// Phone-frame demo only (web/phone/): ?frame=phone adds the iPhone safe areas and stops texts and calls.
if (new URLSearchParams(location.search).get("frame") === "phone") await import("/phone/frame.js");

const app = document.getElementById("app");
const $ = (selector) => app.querySelector(selector);

// Where you are on the drawn map. Starts at the demo spot; real GPS takes over if you are in Lapa.
const here = { you: { ...START }, heading: null, demo: true, real: null };

const icon = {
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M4 6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3H10l-5 4v-4a3 3 0 01-1-2z"/><path d="M9 9.5h6M9 12.5h4"/></svg>',
  sos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#22A06B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  chip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="#E5484D" stroke-width="2" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>',
};
const CHECK = '<svg class="check" viewBox="0 0 132 132" aria-hidden="true"><circle cx="66" cy="66" r="64" fill="none" stroke="#22A06B" stroke-opacity=".18" stroke-width="3"/><circle cx="66" cy="66" r="46" fill="#E4F4EC"/><path d="M48 67l12 12 24-26" stroke="#22A06B" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const progress = (step) => `<div class="progress">${[1, 2, 3].map((i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>`;

// ---------- Story: one night in Lapa, without and then with Beacon ----------
function story(withBeacon = false) {
  const start = START, oldWay = "M78 153 L150 154 L151 208";
  const safeWay = "M78 153 L38 155 L37 236 C90 240,150 249,210 259 C232 263,254 266,274 269";
  const overlay = withBeacon
    ? `<path d="M78 153 L150 154 L151 190" stroke="#1F3A6E" stroke-opacity=".45" stroke-width="2" stroke-dasharray="2 6" fill="none"/>
       <path id="route" d="${safeWay}" stroke="#2F6BFF" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<mask id="reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="393" height="520"><path id="route" d="${oldWay}" stroke="#fff" stroke-width="8" fill="none"/></mask>
       <path d="${oldWay}" stroke="#1F3A6E" stroke-width="3.5" stroke-dasharray="2 8" stroke-linecap="round" fill="none" mask="url(#reveal)"/>`;
  app.innerHTML = `
    <div class="story-top">
      <div class="row"><span class="small">${withBeacon ? "The same night, with Beacon" : ""}</span><button class="label" style="color:var(--muted)" id="skip">Skip</button></div>
      <div class="stamp">${withBeacon ? "01:56 · 200 M BEFORE THE TURN" : "01:58 · LAPA, RIO DE JANEIRO"}</div>
    </div>
    <div class="mapwrap">${mapSvg({ zoneLabel: ["RUA DOS", "INVÁLIDOS"], overlay, top: '<g id="end"></g><g id="mover"></g>' })}
      ${withBeacon ? `<div class="alert"><div class="head"><span class="bang">!</span><span class="label">Red zone ahead</span></div>
        <p class="small">Rua dos Inválidos empties out after 1 a.m. Turn left now and take Av. Mem de Sá, it stays busy.</p></div>` : ""}
    </div>
    <div class="story-text">
      <h2>${withBeacon ? "Same streets, same hour. This time his phone buzzes 200 m before the turn, with no signal, and points him to the busy street home."
                       : "He'd been in Rio two days. The bars were closing, his phone had no signal, and the quickest way back ran down an empty street."}</h2>
      <button class="btn" id="next">${withBeacon ? "Start with Beacon" : "See the same night with Beacon"}</button>
    </div>`;
  $("#skip").onclick = welcome;
  $("#next").onclick = () => (withBeacon ? welcome() : story(true));

  // The walk draws itself over about two seconds.
  const route = $("#route"), mover = $("#mover"), end = $("#end"), length = route.getTotalLength();
  route.style.strokeDasharray = length; route.style.strokeDashoffset = length;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const began = performance.now() + 400;
  (function frame(now) {
    if (!route.isConnected) return; // the screen changed
    const t = still ? 1 : Math.max(0, Math.min(1, (now - began) / 2400));
    route.style.strokeDashoffset = length * (1 - t);
    const at = route.getPointAtLength(length * t), ahead = route.getPointAtLength(Math.min(length, length * t + 2));
    if (withBeacon) {
      const first = route.getPointAtLength(2);
      mover.innerHTML = dotSvg(start, headingBetween(start, first));
      if (t === 1) end.innerHTML = `<circle cx="${at.x}" cy="${at.y}" r="9" fill="#fff"/><circle cx="${at.x}" cy="${at.y}" r="6" fill="#2F6BFF"/>`;
    } else {
      mover.innerHTML = dotSvg(at, headingBetween(at, ahead) ?? 180);
      if (t === 1) end.innerHTML = `<circle cx="${at.x}" cy="${at.y}" r="22" fill="none" stroke="#E5484D" stroke-opacity=".5" stroke-width="2"/><circle cx="${at.x}" cy="${at.y}" r="14" fill="#E5484D" fill-opacity=".3"/>`;
    }
    if (t < 1) requestAnimationFrame(frame);
  })(performance.now());
}

// ---------- Setup 1: what Beacon does (Figma "03 Welcome") ----------
const HERO = `<svg class="hero" viewBox="0 0 345 190" aria-hidden="true"><rect width="345" height="190" rx="22" fill="#101A33"/>
  <g stroke="#2F6BFF" stroke-opacity=".35" stroke-width="1.5" fill="none"><path d="M0 50L345 40M0 135L345 120M95 0L80 190M250 0L240 190"/></g>
  <circle cx="172" cy="95" r="70" fill="none" stroke="#2F6BFF" stroke-opacity=".3" stroke-width="1.5"/>
  <circle cx="172" cy="95" r="46" fill="none" stroke="#2F6BFF" stroke-opacity=".55" stroke-width="2"/>
  <circle cx="172" cy="95" r="24" fill="#2F6BFF"/><circle cx="172" cy="95" r="9" fill="#fff"/>
  <circle cx="272" cy="52" r="6" fill="#E07A2B"/><circle cx="66" cy="140" r="5" fill="#22A06B"/></svg>`;
function welcome() {
  const row = (ico, color, tint, title, detail) => `<div class="card"><div class="tile" style="background:${tint};color:${color}">${ico}</div><div><div class="label">${title}</div><p class="small">${detail}</p></div></div>`;
  app.innerHTML = `<div class="screen">${progress(1)}
    ${HERO}
    <h1>Go anywhere.<br>Beacon has your back, even with no signal.</h1>
    <div class="stack">
      ${row(icon.warn, "var(--red)", "var(--red-tint)", "Warns you before a red zone", "The phone buzzes before you turn into an unsafe street.")}
      ${row(icon.chat, "var(--blue)", "var(--blue-tint)", "Ask Beacon, offline", "The police number, a safe place, what to do. No data needed.")}
      ${row(icon.sos, "var(--amber)", "var(--amber-tint)", "SOS with no signal", "One press, a few words. Your family gets it by text.")}
    </div>
    <div class="grow"></div><button class="btn" id="next">Set up in 1 minute</button></div>`;
  $("#next").onclick = () => contacts(false);
}

// ---------- Setup 2: who gets your SOS (Figma "04 Who gets your SOS"; also opened later from Home's "Edit") ----------
// "Choose from contacts" uses the phone's contact picker where the browser has one (Chrome on Android);
// everywhere else it opens two fields to type a name and number.
const TINTS = [["var(--blue-tint)", "var(--blue)"], ["var(--amber-tint)", "var(--amber)"], ["var(--green-tint)", "var(--green)"]];
function contacts(editing, typing = false) {
  const list = store.contacts, form = typing || !list.length;
  const person = (c, i) => { const [tint, color] = TINTS[i % 3];
    return `<div class="card"><div class="tile avatar" style="background:${tint};color:${color}">${esc(c.name.slice(0, 1).toUpperCase())}</div>
      <div style="flex:1;min-width:0"><div class="label">${esc(c.name)}</div><p class="small">${esc(shortPhone(c.phone))}</p></div>
      ${editing ? `<button class="link small" data-remove="${i}">Remove</button>` : `<span class="tick">${icon.check}</span>`}</div>`; };
  app.innerHTML = `<div class="screen">${editing ? "" : progress(2)}
    <h1>Who should hear from you?</h1>
    <input class="field" id="me" placeholder="Your first name" value="${esc(store.name)}" autocomplete="given-name" aria-label="Your first name">
    ${list.length ? `<div class="stack">${list.map(person).join("")}</div>` : ""}
    ${form ? `<div class="stack">
      <input class="field" id="name" placeholder="Their name, e.g. Mom" autocomplete="off">
      <input class="field" id="phone" placeholder="Phone with country code, e.g. +972…" inputmode="tel" autocomplete="off">
      <p class="error" id="error"></p>
      <button class="chip" id="add" style="align-self:flex-start">+ Add person</button></div>`
    : `<button class="dashed" id="pick">${icon.plus}Choose from contacts</button>`}
    <div class="card" style="padding:16px"><div style="flex:1"><div class="label">Add my location to "I'm OK"</div><p class="small">Only when you tap it. Beacon never tracks you.</p></div>
      <button class="switch" id="where" role="switch" aria-checked="${store.shareLocation}" aria-label="Add my location to I'm OK"><i></i></button></div>
    <div class="grow"></div><button class="btn" id="next" ${list.length ? "" : "disabled"}>${editing ? "Done" : "Continue"}</button></div>`;
  $("#me").oninput = (e) => (store.name = e.target.value);
  $("#where").onclick = (e) => { store.shareLocation = !store.shareLocation; e.currentTarget.setAttribute("aria-checked", store.shareLocation); };
  app.querySelectorAll("[data-remove]").forEach((b) => (b.onclick = () => { store.removeContact(+b.dataset.remove); contacts(editing); }));
  if (form) {
    const error = $("#error");
    $("#name").oninput = $("#phone").oninput = () => (error.textContent = "");
    $("#add").onclick = () => {
      const name = $("#name").value.trim(), phone = cleanPhone($("#phone").value);
      if (!name) return (error.textContent = "Enter their name.");
      if (!phone) return (error.textContent = "Enter the full number with country code, like +972501234567.");
      store.addContact(name, phone); contacts(editing);
    };
  } else {
    $("#pick").onclick = async () => {
      if (!("contacts" in navigator && "select" in navigator.contacts)) return contacts(editing, true);
      try {
        for (const c of await navigator.contacts.select(["name", "tel"], { multiple: true })) {
          const phone = (c.tel || []).map(cleanPhone).find(Boolean);
          if (phone) store.addContact((c.name || [])[0] || phone, phone);
        }
      } catch { /* closed the picker */ }
      contacts(editing);
    };
  }
  $("#next").onclick = () => (editing ? home() : ready());
}

// ---------- Setup 3: what is saved on this device (Figma "06 Ready offline") ----------
// The AI row shows Chrome's on-device model download (aiLoaded, 0 to 1) while it runs.
let aiLoaded = null;
async function ready() {
  const done = '<span class="stamp" style="color:var(--green)">DONE</span>';
  const row = (kind, tint, color, title, detail, end = done) => `<div class="card"><div class="tile" style="background:${tint};color:${color}">${kind}</div><div style="flex:1"><div class="label">${title}</div><p class="small">${detail}</p></div>${end}</div>`;
  const city = pack.city.replace(" de Janeiro", "");
  const draw = (ai) => {
    const loading = ai && aiLoaded != null && aiLoaded < 1, pct = Math.round((aiLoaded || 0) * 100);
    app.innerHTML = `<div class="screen">${progress(3)}
      <h1>Getting ${city} ready for when you're offline</h1>
      <div class="stack">
        ${row(icon.warn, "var(--red-tint)", "var(--red)", "1 red zone mapped", `${pack.zone.name}, ${clock(pack.zone.fromHour)} to ${clock(pack.zone.toHour)}`)}
        ${row(icon.pin, "var(--blue-tint)", "var(--blue)", `${pack.places.length} safe places saved`, "Police station and hospital, open 24 hours")}
        ${row(icon.book, "var(--amber-tint)", "var(--amber)", `${city} safety pack`, `Police ${pack.police}, ambulance ${pack.ambulance}, embassy, key phrases`)}
        ${ai ? row(icon.chip, "var(--blue-tint)", "var(--blue)", "AI for your phone", "On this device when it can, cloud when it can't", loading ? `<span class="stamp" style="color:var(--blue)" id="ai-pct">${pct}%</span>` : done) : ""}
      </div>
      ${loading ? `<div class="bar"><i id="ai-bar" style="width:${pct}%"></i></div>` : ""}
      <div class="grow"></div><button class="btn" id="next">Start exploring ${city}</button></div>`;
    $("#next").onclick = () => { store.setupDone = true; home(); };
  };
  draw(false);
  if (await aiReady() && $("#next")) { draw(true); redrawReady = () => draw(true); }
}
let redrawReady = null;

// ---------- Home: the map, Ask Beacon, the nearest safe place, SOS ----------
// `highlight` is a saved place Beacon recommended (Ask Beacon or a scan): a yellow ring blinks around it,
// then stays until you tap the map. Coming back to Home later shows no ring.
function home(highlight = null) {
  const shown = pack.places.find((p) => p.name === highlight);
  const closeness = zoneCloseness(here.you), risky = zoneRiskyAt(new Date().getHours()), z = pack.zone;
  const near = nearestPlace(here.you);
  const place = shown ? { ...shown, meters: Math.round(Math.hypot(shown.x - here.you.x, shown.y - here.you.y) * 2.34) } : near;
  const ring = shown ? `<circle class="go-here" cx="${shown.x}" cy="${shown.y}" r="22"/>` : "";
  const names = joinNames(store.contacts.map((c) => c.name));
  app.innerHTML = `
    <div class="mapwrap" style="min-height:300px">${mapSvg({ you: here.you, heading: here.heading, zoneLabel: ["RED ZONE", `AFTER ${clock(z.fromHour).toUpperCase()}`], top: ring })}
      ${closeness === "far" ? "" : `<div class="banner"><div class="tile" style="width:40px;height:40px;border-radius:12px;background:var(--red);color:#fff">${icon.warn}</div>
        <div><div class="label">${closeness === "inside" ? "You're in a red zone" : "Red zone ahead"}</div><p class="small">${z.name} · ${risky ? "avoid now" : `risky after ${clock(z.fromHour)}`}. Take ${z.saferStreet}.</p></div></div>`}
      ${here.demo ? '<div class="hint small">Demo: tap the map to walk</div>' : ""}
    </div>
    <div class="sheet"><div class="grab"></div>
      <div class="askbar"><button id="ask">Ask Beacon anything</button><button class="sq" id="talk" aria-label="Ask by voice">${icon.mic}</button></div>
      <div class="chips"><button class="chip" data-q="Is this area OK now?">Is this area OK now?</button><button class="chip" data-q="Where's a safe place?">Where's a safe place?</button></div>
      <div class="card"><div class="tile" style="width:40px;height:40px;border-radius:12px;background:${place.kind === "hospital" ? "var(--red-tint)" : "var(--blue-tint)"}">${badge(place.kind, 28)}</div><div><div class="label">${place.name} · ${place.meters} m</div><p class="small">Open 24 hours</p></div></div>
      <div class="two"><a id="ok" href="#">${icon.check}I'm OK</a><button id="scan">${icon.camera}Scan</button><a href="tel:${pack.police}">${icon.phone}Police ${pack.police}</a></div>
      <button class="btn red hold" id="sos">Hold for SOS · works with no signal</button>
      <div class="foot small"><span>Goes to ${esc(names)}</span><button class="link small" id="edit">Edit</button></div>
    </div>`;
  const svg = $("svg.map");
  // Demo: tap the map to walk there. With real GPS in Lapa, the dot follows you instead.
  svg.onclick = (e) => { if (shown) return home(); if (!here.demo) return; const to = tapToSpot(svg, e); here.heading = headingBetween(here.you, to) ?? here.heading; here.you = to; home(); };
  $("#ask").onclick = () => ask("");
  $("#talk").onclick = () => ask("", true);
  app.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => ask(b.dataset.q)));
  $("#ok").href = smsLink(store.contacts.map((c) => c.phone), checkInText(store.name, store.shareLocation ? here.real : null));
  holdToStart($("#sos"), () => sos());
  $("#scan").onclick = () => scanScreen(app, { back: () => home(), showPlace: (name) => home(name), backIcon: icon.back });
  $("#edit").onclick = () => contacts(true);
  watchGps();
}

// The SOS button starts after a hold of about a second, so it can't go off in a pocket.
// From the keyboard (Enter or Space) one press is enough.
function holdToStart(button, start) {
  let timer = null;
  const label = button.textContent;
  const stop = () => { clearTimeout(timer); timer = null; button.classList.remove("holding"); };
  button.onpointerdown = (e) => { e.preventDefault(); button.classList.add("holding"); timer = setTimeout(() => { stop(); start(); }, 900); };
  button.onpointerup = button.onpointerleave = button.onpointercancel = () => {
    if (!timer) return;
    stop(); button.textContent = "Keep holding to start the SOS";
    setTimeout(() => button.isConnected && (button.textContent = label), 1800);
  };
  button.onclick = (e) => { if (e.detail === 0) start(); };
}

// Asks the browser for your position once Home is open. Outside Lapa the map stays in demo mode,
// but your real position is still kept for the SOS message.
let watching = false;
function watchGps() {
  if (watching || !navigator.geolocation) return;
  watching = true;
  navigator.geolocation.watchPosition((pos) => {
    here.real = { lat: pos.coords.latitude, lng: pos.coords.longitude, takenAtMillis: pos.timestamp, accuracy: pos.coords.accuracy };
    const spot = gpsToSpot(here.real.lat, here.real.lng);
    if (!spot) return;
    here.heading = headingBetween(here.you, spot) ?? here.heading; here.you = spot; here.demo = false;
    if ($(".sheet")) home();
  }, () => {}, { enableHighAccuracy: true });
}

// ---------- Ask Beacon: a chat that answers from the saved pack ----------
const chat = []; // [{you, text, source, place}]: source = where an AI answer ran (null = plain rules); place = the saved place Beacon recommended, for "Show on map"
// listen: start with the microphone (Home's mic button), where the browser can turn speech into text.
async function ask(question, listen = false) {
  let thinking = false, talking = false;
  const draw = () => {
    app.innerHTML = `<div class="screen" style="gap:0;padding-top:12px">
      <div class="chat-top"><button class="back" id="back" aria-label="Back">${icon.back}</button>${copSvg(talking)}</div>
      <div class="bubbles" id="bubbles">
        ${chat.map((line) => `<div class="bubble ${line.you ? "you" : "beacon"}">${esc(line.text)}</div>${line.you ? "" : aiBadge(sourceLabel(line.source))}${line.place && !talking ? `<button class="link left show" data-place="${esc(line.place)}">Show ${esc(line.place)} on the map</button>` : ""}`).join("")}
        ${thinking ? '<div class="bubble beacon">…</div>' : ""}
        ${chat.length || thinking ? "" : `<div class="stack center">${["What's the police number?", "Is this area OK now?", "Where's a safe place?"].map((q) => `<button class="chip label" data-q="${q}">${q}</button>`).join("")}</div>`}
      </div>
      <form class="askbar" id="form"><input id="box" placeholder="${chat.length ? "Ask a follow-up" : "Ask Beacon anything"}" autocomplete="off" aria-label="Your question"><button class="sq" id="go" aria-label="Ask by voice">${icon.mic}</button></form>
    </div>`;
    $("#back").onclick = home;
    const box = $("#box"), go = $("#go");
    // Empty box: the button is the microphone. Something typed: it sends.
    box.oninput = () => { const typed = !!box.value.trim(); go.innerHTML = typed ? icon.arrow : icon.mic; go.setAttribute("aria-label", typed ? "Send" : "Ask by voice"); };
    $("#form").onsubmit = (e) => { e.preventDefault(); box.value.trim() ? send(box.value) : hear(); };
    app.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => send(b.dataset.q)));
    app.querySelectorAll("[data-place]").forEach((b) => (b.onclick = () => home(b.dataset.place)));
    const bubbles = $("#bubbles"); bubbles.scrollTop = bubbles.scrollHeight;
  };
  const send = async (text) => {
    text = text.trim();
    if (!text || thinking) return;
    // Earlier question/answer pairs, so a follow-up like "is it open?" makes sense.
    const earlier = []; for (let i = 0; i + 1 < chat.length; i += 2) earlier.push([chat[i].text, chat[i + 1].text]);
    chat.push({ you: true, text }); thinking = true; draw();
    const reply = await answer(text, earlier, here.you);
    chat.push({ you: false, text: reply.text, source: reply.source, place: recommends(text) ? nearestPlace(here.you).name : null }); thinking = false; talking = true; draw();
    setTimeout(() => { talking = false; if ($("#bubbles")) { draw(); $("#box").focus(); } }, 1600);
  };
  // Speech to text, where the browser has it (Chrome). Without it the box gets the focus instead.
  const hear = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return $("#box")?.focus();
    const rec = new Speech(); rec.lang = "en-US"; rec.interimResults = false;
    $("#box").placeholder = "Listening…";
    rec.onresult = (e) => send(e.results[0][0].transcript);
    rec.onend = () => { if ($("#box")) $("#box").placeholder = chat.length ? "Ask a follow-up" : "Ask Beacon anything"; };
    rec.onerror = () => $("#box")?.focus();
    rec.start();
  };
  draw();
  if (question) send(question);
  else if (listen) hear();
}

// ---------- SOS: a few words in, a clear message out ----------
// draft is null until the message is written; then { text, source, ids }:
// source = where AI rewrote her words (null = plain sentence), ids = the family page's ids (null = no Firebase).
function sos(note = "", draft = null) {
  const people = store.contacts;
  app.innerHTML = `<div class="screen">
    <button class="back" id="back" style="position:static;transform:none" aria-label="Back">${icon.back}</button>
    <h1>What's happening?</h1>
    <textarea class="field" id="note" placeholder="A few words are enough">${esc(note)}</textarea>
    <div class="chips">${["Being followed", "Feel unsafe", "Hurt", "Lost", "In a vehicle"].map((q) => `<button class="chip" data-pick="${q}">${q}</button>`).join("")}</div>
    <p class="error" id="error"></p>
    ${draft ? `<div class="stack"><div class="row-between"><span class="label">Message to ${esc(joinNames(people.map((c) => c.name)))}</span>${aiBadge(sourceLabel(draft.source))}</div>
      <textarea class="field" id="draft" style="height:190px">${esc(draft.text)}</textarea>
      <p class="small">${draft.ids ? "The link in it opens a page where they can follow this SOS. " : ""}You can change anything before you send.</p></div>` : ""}
    <div class="grow"></div>
    ${draft ? `<a class="btn red" id="send" style="display:grid;place-items:center;text-decoration:none" href="#">Open messages to send</a>` : `<button class="btn" id="write">Write the message</button>`}
  </div>`;
  const noteBox = $("#note"), error = $("#error");
  $("#back").onclick = home;
  noteBox.oninput = () => (error.textContent = "");
  app.querySelectorAll("[data-pick]").forEach((b) => (b.onclick = () => { noteBox.value = noteBox.value.trim() ? `${noteBox.value.trim()}, ${b.dataset.pick.toLowerCase()}` : b.dataset.pick; error.textContent = ""; }));
  if (!draft) {
    $("#write").onclick = async () => {
      const words = noteBox.value.trim();
      if (!words) return (error.textContent = "Type or tap what's happening first.");
      $("#write").disabled = true; $("#write").textContent = "Writing…";
      const ids = await prepareIncident();
      sos(words, { ...(await writeSos(store.name, words, here.real, ids?.link ?? null)), ids });
    };
  } else {
    const link = $("#send"), draftBox = $("#draft");
    const refresh = () => (link.href = smsLink(people.map((c) => c.phone), draftBox.value));
    draftBox.oninput = refresh; refresh();
    link.onclick = () => setTimeout(() => sent(draftBox.value, noteBox.value.trim(), draft.ids), 300); // let the messages app open first
  }
}

// ---------- After the SOS: call the police, walk to a safe place, words to show people ----------
// ids: the family page's ids, or null when there is no Firebase. The incident is saved for the family
// page here, at the moment she opens her messages app.
function sent(message, note, ids) {
  const place = nearestPlace(here.you), people = store.contacts;
  // What is true about the family page right now, in plain words.
  const SYNC = {
    saving: "Family page: saving…",
    synced: "Family page updated. The link in your message shows them this SOS.",
    saved: "Family page: saved on this device. It updates when you're online.",
    failed: "Family page could not be updated. Your text still has your message.",
    off: "",
  };
  app.innerHTML = `<div class="screen center" style="text-align:center">
    ${CHECK}
    <h1>Press send so ${esc(joinNames(people.map((c) => c.name)))} ${people.length > 1 ? "know" : "knows"}</h1>
    <p class="small" id="sync" aria-live="polite">${ids ? SYNC.saving : ""}</p>
    <div class="card" style="width:100%;text-align:left"><p class="small" style="color:var(--ink);white-space:pre-wrap">${esc(message)}</p></div>
    <a class="btn red" style="display:grid;place-items:center;text-decoration:none" href="tel:${pack.police}">Call police ${pack.police}</a>
    <div class="outline" style="width:100%;text-align:left">${badge(place.kind, 32)}<div><div class="label">Walk to ${place.name}</div><p class="small">${place.meters} m, open 24 hours</p></div></div>
    <div class="card" style="width:100%;text-align:left;flex-direction:column;align-items:flex-start;gap:8px"><div class="label">Show to people nearby</div>${pack.phrases.slice(0, 2).map(([en, pt]) => `<div><div class="phrase">${pt}</div><p class="small">${en}</p></div>`).join("")}</div>
    <div class="grow"></div>
    <div id="end" class="stack center" style="width:100%"></div>
    <button class="link" id="back">Back to the map</button></div>`;
  $("#back").onclick = home;
  const say = (status) => { if ($("#sync")) $("#sync").textContent = SYNC[status] ?? ""; };
  if (ids) {
    saveIncident(ids, { name: store.name, description: note, situation: pickSituation(note), message, fix: here.real }, () => say("synced")).then(say);
  }
  // Ending it: tell the family page, then open messages with a short "it's over" text for her to send.
  // She confirms on the page itself (a browser pop-up can be blocked without her seeing it).
  const offerEnd = () => {
    $("#end").innerHTML = `<button class="btn quiet" id="safe">${icon.check}I'm safe now, end SOS</button>`;
    $("#safe").onclick = () => {
      $("#end").innerHTML = `<p class="label">End the SOS and tell your contacts it is over?</p>
        <div class="two" style="width:100%"><button id="yes">Yes, end it</button><button id="no">Not yet</button></div>`;
      $("#no").onclick = offerEnd;
      $("#yes").onclick = end;
    };
  };
  offerEnd();
  const end = () => {
    if (ids) endIncident(ids, here.real);
    const over = endedText(store.name);
    app.innerHTML = `<div class="screen center" style="text-align:center">${CHECK}<h1>SOS ended</h1>
      <p class="small">Press send in your messages app so they know.</p>
      <div class="card" style="width:100%;text-align:left"><p class="small" style="color:var(--ink);white-space:pre-wrap">${esc(over)}</p></div>
      <a class="btn" style="display:grid;place-items:center;text-decoration:none" href="${esc(smsLink(people.map((c) => c.phone), over))}">Open messages to send</a>
      <div class="grow"></div><button class="link" id="back">Back to the map</button></div>`;
    $("#back").onclick = home;
  };
}

// ---------- On-device AI getting ready ----------
// Chrome downloads its built-in model once, after the first click on the page. A small note at the
// bottom shows the progress; nothing waits for it (answers come from the cloud until it is ready).
function showAiProgress(loaded) {
  aiLoaded = loaded;
  if ($("#ai-pct")) { $("#ai-pct").textContent = `${Math.round(loaded * 100)}%`; $("#ai-bar").style.width = `${Math.round(loaded * 100)}%`; }
  if (loaded >= 1 && $("#ai-pct")) redrawReady?.();
  let note = document.getElementById("ai-status");
  if (!note) { if (loaded >= 1) return; note = Object.assign(document.createElement("div"), { id: "ai-status" }); note.setAttribute("role", "status"); document.body.append(note); }
  note.textContent = loaded >= 1 ? "AI is ready on this computer" : `Getting AI ready on this computer · ${Math.round(loaded * 100)}%`;
  if (loaded >= 1) setTimeout(() => note.remove(), 2500);
}

// ---------- Start ----------
if (new URLSearchParams(location.search).has("reset")) store.reset(); // add ?reset to the address to start over
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); // lets the page open offline
document.addEventListener("click", () => warmUp(showAiProgress), { once: true });
const page = route(location);
if (page.name === "family") familyScreen(app, (onState) => watchShare(page.param, onState), { shareId: page.param });
else if (page.name === "demo") familyScreen(app, watchDemo, { demo: true });
else {
  store.setupDone && store.contacts.length ? home() : story();
  // An SOS saved while there was no connection goes to the family page once there is one.
  resumeSync();
  addEventListener("online", () => flushPending());
}
