// The scan check screen: "Is this legit?" Photo of an exchange board, meter, ticket or price ->
// the AI reads it (only when AI is set up) -> she checks or types the number -> Looks fair / Be careful / Walk away.
// Same flow as the Android app's ScanScreen. The verdict is plain math in js/scams.js, never the AI.
import { scamPacks, judge, parseNumber, KINDS, LABEL } from "./scams.js";
import { pack } from "./pack.js";
import { aiReady, askAiAboutImage } from "./ai.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const DOT = { fair: "var(--green)", careful: "var(--yellow)", walk: "var(--amber)", unknown: "var(--muted)" };
const READ_PROMPT = `Read this photo for a traveler. Only write what is visible; do not give advice. Return ONLY JSON:
{"kind":"Money|Taxi|Tour|Shop|Ticket|Other","text":"what the sign says, max 40 words",
 "rate":{"from":"EUR","to":"RON","buy":4.20},"price":{"currency":"EGP","amount":1500}}
Use 3-letter currency codes; "buy" is what they pay for 1 unit of "from". Leave out rate or price if there is none.`;

let city = "rio"; // the demo can switch to Bucharest for the money-exchange example

export function scanScreen(app, { back, showPlace, backIcon }) {
  const state = { step: "start", photo: null, read: null, note: "", verdict: null };
  const $ = (s) => app.querySelector(s);
  const saved = () => scamPacks[city];

  const draw = () => {
    app.innerHTML = `<div class="screen">
      <button class="back-inline" id="back" aria-label="Back">${backIcon}</button>
      <h1>Is this legit?</h1>
      ${state.photo ? `<img class="scan-photo" src="${state.photo}" alt="Your photo">` : ""}
      ${{ start, reading: () => '<p>Reading…</p>', confirm, verdict }[state.step]()}
      <div class="grow"></div>
      ${state.step === "start" ? `<button class="link small center-self" id="city">Demo city: ${saved().city} · switch to ${city === "rio" ? "Bucharest" : "Rio de Janeiro"}</button>` : ""}
    </div>`;
    $("#back").onclick = back;
    $("#city")?.addEventListener("click", () => { city = city === "rio" ? "bucharest" : "rio"; draw(); });
    $("#photo")?.addEventListener("change", (e) => takePhoto(e.target.files?.[0]));
    $("#type")?.addEventListener("click", () => { state.step = "confirm"; state.note = ""; draw(); });
    $("#again")?.addEventListener("click", () => { Object.assign(state, { step: "start", photo: null, read: null, verdict: null }); draw(); });
    app.querySelectorAll("[data-kind]").forEach((b) => (b.onclick = () => { state.read = { ...(state.read || {}), kind: b.dataset.kind }; draw(); }));
    $("#check")?.addEventListener("click", check);
    $("#show")?.addEventListener("click", () => showPlace(state.verdict.saferOption));
    $("#sources")?.addEventListener("click", () => $("#srclist").toggleAttribute("hidden"));
  };

  const start = () => `<p>Take a photo of the exchange board, taxi meter, ticket or price. Beacon checks it against what travelers report in ${saved().city}, with no signal.</p>
    <label class="btn file">Take a photo<input id="photo" type="file" accept="image/*" capture="environment" hidden></label>
    <button class="link left" id="type">Type it instead</button>`;

  const confirm = () => {
    const r = state.read || {}, kind = r.kind || "Money", rate = saved().scams.flatMap((s) => s.fairRates || [])[0];
    const field = (id, value, width) => `<input class="mini" id="${id}" value="${esc(value ?? "")}" style="width:${width}px" aria-label="${id}">`;
    return `<div class="card col">${state.note ? `<p class="small">${state.note}</p>` : ""}
      <h2>${r.text ? "We read" : "What are you looking at?"}</h2>${r.text ? `<p class="small">“${esc(r.text)}”</p>` : ""}
      <div class="chips">${KINDS.map((k) => `<button class="chip ${k === kind ? "on" : ""}" data-kind="${k}">${k}</button>`).join("")}</div>
      <div class="row">${kind === "Money"
        ? `<span>They pay for 1</span>${field("from", r.rate?.from ?? rate?.from ?? "EUR", 64)}${field("num", r.rate?.buy, 80)}${field("to", r.rate?.to ?? rate?.to ?? "", 64)}`
        : `<span>They ask</span>${field("num", r.price?.amount, 90)}${field("cur", r.price?.currency ?? "", 64)}`}</div>
      <button class="btn" id="check">Check it</button></div>`;
  };

  const verdict = () => {
    const v = state.verdict, w = v.warning, onMap = pack.places.some((p) => p.name === v.saferOption);
    return `<div class="card col">
      <div class="row"><i class="dot" style="background:${DOT[v.verdict]}"></i><h1 class="grow">${LABEL[v.verdict]}</h1>${state.badge ? `<span class="small">${state.badge}</span>` : ""}</div>
      ${v.why !== LABEL[v.verdict] ? `<p>${esc(v.why)}</p>` : ""}
      <p>What to do: ${esc(v.whatToDo)}</p>
      ${onMap ? `<button class="btn" id="show">Show ${esc(v.saferOption)} on the map</button>` : v.saferOption ? `<p>Better: ${esc(v.saferOption)}</p>` : ""}
      ${w ? `<p class="small">From your ${saved().city} pack, saved on this phone${w.reports ? ` · ${w.reports} traveler reports` : ""}</p>
        <button class="link small left" id="sources">Sources</button><div id="srclist" class="small" hidden>${w.sources.map(esc).join("<br>")}</div>` : ""}
    </div><button class="link left" id="again">Scan something else</button>`;
  };

  async function takePhoto(file) {
    if (!file) return;
    state.photo = URL.createObjectURL(file);
    if (!(await aiReady())) { state.step = "confirm"; state.note = "No AI on this page, so type what you see."; return draw(); }
    state.step = "reading"; draw();
    const text = await askAiAboutImage(READ_PROMPT, file);
    try { state.read = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); state.badge = "AI read"; }
    catch { state.read = null; state.note = "Couldn't read it. Type what you see."; }
    state.step = "confirm"; draw();
  }

  function check() {
    const kind = state.read?.kind || "Money", n = parseNumber($("#num").value), text = state.read?.text || "";
    const reading = kind === "Money"
      ? { kind, text, rate: n == null ? null : { from: $("#from").value.trim().toUpperCase(), to: $("#to").value.trim().toUpperCase(), buy: n } }
      : { kind, text, price: n == null ? null : { currency: $("#cur").value.trim().toUpperCase(), amount: n } };
    state.verdict = judge(reading, saved().scams); state.step = "verdict"; draw();
  }

  draw();
}
