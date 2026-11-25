// The family view: what a trusted contact sees after opening the link in the SOS text.
// Top to bottom: who and since when, the map with the latest position and trail, how old that position
// is, "What's happening and what should I do?", the local emergency numbers as big call links, the
// message that was sent, and the list of what happened. It updates by itself.
// The wording uses the traveler's name and never "she" or "he": the page does not know which fits.
// `watch(onState)` supplies the data and returns { stop, replay? }: js/familydata.js for a real link,
// js/demo.js for /demo. This file only draws; it never talks to Firebase.
import { esc, aiBadge } from "./html.js";
import { sourceLabel } from "./ai.js";
import { createFamilyMap } from "./familymap.js";
import { summaryTemplate, writeSummary } from "./summary.js";
import { ageText, clockText, latestFix, timelineItems, trail, travelerName } from "./timeline.js";

// Plain words for every state that has nothing to show yet.
const NOTES = {
  loading: ["Opening the link…", ""],
  "bad-link": ["This link doesn't look right", "Copy the whole link from the text message and try again. If you are worried, call the person who sent it."],
  waiting: ["Nothing from the phone yet", "A text message can arrive before the phone that sent it has an internet connection. This page fills in by itself as soon as it does. Until then, call the person who sent it, and use the location in the text message."],
  "no-incident": ["No SOS right now", "This link is working. If an SOS starts, it shows here by itself."],
  off: ["This link has been turned off", "The traveler stopped sharing with this link. If you are worried, call them."],
  offline: ["Can't reach Beacon right now", "Check this device's internet connection. The page keeps trying. The location in the text message still works."],
};
const AI_GAP_MILLIS = 20_000; // the summary is rewritten on new events only, and never more often than this

export function familyScreen(app, watch, { demo = false } = {}) {
  app.classList.add("wide");
  app.innerHTML = `<div class="family">
    <header class="fam-head"><span class="stamp">BEACON${demo ? " · DEMO" : ""}</span><div id="fam-title"></div></header>
    ${demo ? '<div class="fam-demo small"><span>A made-up incident in Lapa, Rio, replayed about 12 times faster. Nothing here is real.</span><button class="link" id="fam-replay">Play again</button><i id="fam-bar"></i></div>' : ""}
    <div id="fam-note" class="card col"></div>
    <div class="fam-grid" id="fam-grid" hidden>
      <section class="fam-left"><div id="fam-map" class="fam-map" role="img" aria-label="Map of the latest position and the trail"></div><div id="fam-last" class="card col"></div></section>
      <section class="fam-right"><div id="fam-summary" class="card col"></div><div id="fam-numbers" class="card col"></div><div id="fam-message" class="card col"></div><div id="fam-timeline" class="card col"></div></section>
    </div></div>`;
  const $ = (id) => app.querySelector(`#${id}`);
  let state = { status: "loading" }, map = null, mapAsked = false;
  let summary = { text: "", source: null }, summaryKey = "", aiTimer = null, lastAiAt = 0;

  function drawSummary() {
    $("fam-summary").innerHTML = `<h2>What's happening and what should I do?</h2><p class="fam-text">${esc(summary.text)}</p>
      ${aiBadge(sourceLabel(summary.source))}<p class="small">Beacon only knows what the phone reported. It cannot tell what is really happening.</p>`;
  }
  // The fixed wording shows at once. AI may replace it, on new events only (never on a timer).
  function refreshSummary() {
    const key = `${state.incident.id}|${state.incident.phase}|${state.updates.length}`;
    if (key === summaryKey) return;
    summaryKey = key;
    summary = { text: summaryTemplate(state.incident, state.updates), source: null };
    drawSummary();
    const { incident, updates } = state;
    clearTimeout(aiTimer);
    aiTimer = setTimeout(async () => {
      lastAiAt = Date.now();
      const written = await writeSummary(incident, updates);
      if (summaryKey === key && written.source && $("fam-summary")) { summary = written; drawSummary(); }
    }, Math.max(0, AI_GAP_MILLIS - (Date.now() - lastAiAt)));
  }

  function drawLast() {
    const fix = latestFix(state.updates), now = Date.now();
    $("fam-last").innerHTML = fix
      ? `<div class="fam-age">Last seen ${esc(ageText(fix.atMillis, now))}</div>
         <p class="small">${esc(clockText(fix.atMillis))} your time${fix.accuracyMeters >= 1 ? ` · within about ${Math.round(fix.accuracyMeters)} m` : ""}${fix.batteryPercent != null ? ` · phone battery ${Math.round(fix.batteryPercent)}%` : ""}</p>
         <a class="link" target="_blank" rel="noopener" href="https://maps.google.com/?q=${fix.lat.toFixed(5)},${fix.lng.toFixed(5)}">Open this spot in Google Maps</a>`
      : `<div class="fam-age">No location yet</div><p class="small">The phone has not reported a GPS position.</p>`;
  }

  function draw() {
    const ready = state.status === "ready";
    $("fam-grid").hidden = !ready; $("fam-note").hidden = ready;
    if (demo && state.progress != null) $("fam-bar").style.width = `${Math.round(state.progress * 100)}%`;
    if (!ready) {
      const [title, detail] = demo && state.status === "no-incident" ? ["Waiting for the first alert…", "The replay is starting."] : NOTES[state.status] ?? NOTES.offline;
      $("fam-title").innerHTML = ""; summaryKey = "";
      $("fam-note").innerHTML = `<h1>${esc(title)}</h1><p>${esc(detail)}</p>`;
      map?.show([]);
      return;
    }
    const { incident, updates } = state, name = travelerName(incident), e = incident.emergency || {}, ended = incident.phase === "Resolved";
    $("fam-title").innerHTML = `<h1>${esc(name)}'s SOS <span class="pill ${ended ? "ok" : "live"}">${ended ? "Ended" : "Active"}</span></h1>
      <p class="small">${esc(incident.city)}, ${esc(incident.country)} · started ${esc(clockText(incident.startedAtMillis))} your time${state.fromCache ? " · showing what this device saved; it is offline" : ""}</p>`;
    drawLast(); refreshSummary();
    const tel = (label, number, cls = "") => (number ? `<a class="tel ${cls}" href="tel:${esc(number.replace(/[^\d+]/g, ""))}"><span>${esc(label)}</span><b>${esc(number)}</b></a>` : "");
    $("fam-numbers").innerHTML = `<h2>Emergency numbers in ${esc(incident.city)}</h2>${tel("Police", e.police, "red")}${tel("Ambulance", e.ambulance)}${tel(e.embassyName, e.embassyPhone)}
      <p class="small">Short local numbers usually only work from inside ${esc(incident.country)}. From another country, call the embassy line and give them the location above.</p>`;
    $("fam-message").hidden = !incident.message;
    $("fam-message").innerHTML = `<h2>The message that was sent</h2><p class="fam-text small" style="color:var(--ink)">${esc(incident.message)}</p>`;
    $("fam-timeline").innerHTML = `<h2>What happened</h2><ol class="fam-list">${timelineItems(incident, updates).map((item) =>
      `<li class="k-${item.kind}"><time>${esc(clockText(item.atMillis))}</time><div><div class="label">${esc(item.title)}</div>${item.detail ? `<p class="small">${esc(item.detail)}</p>` : ""}</div></li>`).join("")}</ol>`;
    if (!mapAsked) {
      mapAsked = true;
      createFamilyMap($("fam-map")).then((made) => {
        map = made;
        if (map) map.show(trail(state.updates ?? []));
        else $("fam-map").innerHTML = '<p class="small fam-nomap">The map could not load. Use "Open this spot in Google Maps" below.</p>';
      });
    }
    map?.show(trail(updates));
  }

  const source = watch((next) => { state = next; if ($("fam-grid")) draw(); });
  const clock = setInterval(() => { if (!$("fam-grid")) { clearInterval(clock); source.stop?.(); } else if (state.status === "ready") drawLast(); }, 15_000);
  if (demo) $("fam-replay").onclick = () => { summaryKey = ""; source.replay?.(); };
  draw();
}
