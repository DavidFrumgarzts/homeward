// The scan check: "Is this legit?" A photo of what's in front of you (a pedicab, a ticket seller, a sign) ->
// the AI picks which saved scam it shows, or none -> Walk away / Be careful / Nothing saved about this.
// No price is asked: scammers rarely say it until it's too late. "They told me a price" is there if you have one.
// The verdict is the saved scam's level, never the AI's opinion.
import { judge, parseNumber, LABEL } from "../../js/scams.js";
import { matchPrompt, readMatch, verdictFor } from "../../js/cityscams.js";
import { aiReady, askAiAboutImage } from "../../js/ai.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const DOT = { fair: "var(--green)", careful: "var(--yellow)", walk: "var(--amber)", unknown: "var(--muted)" };
const host = (u) => u.replace("https://", "").replace("www.", "").split("/")[0];

// scams: the list saved for this city. status: a line about where they come from.
export function scanScreen(app, { back, backIcon, city, scams, status }) {
  const s = { step: "start", photo: null, seen: "", verdict: null, badge: "", note: "", showPrice: false };
  const $ = (q) => app.querySelector(q);

  const body = () => {
    const v = s.verdict, w = v?.warning;
    return {
      start: () => `<p>Take a photo of what's in front of you: a pedicab, a ticket seller, a costumed character, a sign. Beacon checks it against ${scams.length} scams reported in ${esc(city)}.</p>
        <p class="small">${esc(status)}</p>
        <label class="btn file">Take a photo<input id="photo" type="file" accept="image/*" capture="environment" hidden></label>
        <button class="link left" id="type">Describe it instead</button>`,
      reading: () => "<p>Looking at your photo…</p>",
      describe: () => `<div class="card col">${s.note ? `<p class="small">${esc(s.note)}</p>` : ""}<h2>What do you see?</h2>
        <input class="field" id="what" placeholder="e.g. a guy selling Statue of Liberty tickets" value="${esc(s.seen)}">
        <button class="btn" id="check">Check it</button></div>`,
      verdict: () => `<div class="card col">
        ${s.seen ? `<p class="small">What we see: ${esc(s.seen)}</p>` : ""}
        <div class="row"><i class="dot" style="background:${DOT[v.verdict]}"></i><h1 class="grow">${LABEL[v.verdict]}</h1>${s.badge ? `<span class="small">${esc(s.badge)}</span>` : ""}</div>
        ${w ? `<div class="label">${esc(w.title)}</div>` : ""}
        ${v.why !== LABEL[v.verdict] ? `<p>${esc(v.why)}</p>` : ""}
        ${w?.travelersSay ? `<p><b>Reports say:</b> ${esc(w.travelersSay)}</p>` : ""}
        <p><b>What to do:</b> ${esc(v.whatToDo)}</p>
        ${v.saferOption ? `<p><b>Better:</b> ${esc(v.saferOption)}</p>` : ""}
        ${w?.fairPrices?.length ? (s.showPrice
          ? `<div class="row"><span>They asked</span><input class="mini" id="num" style="width:90px" inputmode="decimal" aria-label="price"><span>USD</span><button class="chip" id="cmp">Compare</button></div>`
          : '<button class="link left" id="addprice">They told me a price</button>') : ""}
        ${w ? `<p class="small">From reports saved for ${esc(city)}${w.reports ? ` · ${w.reports} reports` : ""}</p>
          <div class="small">${w.sources.map((u) => `<a href="${/^https:\/\//.test(u) ? esc(u) : "#"}" target="_blank" rel="noopener">${esc(host(u))}</a>`).join("<br>")}</div>` : ""}
        </div><button class="link left" id="again">Scan something else</button>`,
    }[s.step]();
  };

  const draw = () => {
    app.innerHTML = `<div class="screen">
      <button class="back-inline" id="back" aria-label="Back">${backIcon}</button>
      <h1>Is this legit?</h1>
      ${s.photo ? `<img class="scan-photo" src="${s.photo}" alt="Your photo">` : ""}
      ${body()}
      <div class="grow"></div></div>`;
    $("#back").onclick = back;
    $("#photo")?.addEventListener("change", (e) => takePhoto(e.target.files?.[0]));
    $("#type")?.addEventListener("click", () => { s.step = "describe"; s.note = ""; draw(); });
    $("#again")?.addEventListener("click", () => { Object.assign(s, { step: "start", photo: null, seen: "", verdict: null, badge: "", showPrice: false }); draw(); });
    $("#check")?.addEventListener("click", () => { s.seen = $("#what").value.trim(); if (!s.seen) return; s.verdict = judge({ kind: "Other", text: s.seen }, scams); s.badge = ""; s.step = "verdict"; draw(); });
    $("#addprice")?.addEventListener("click", () => { s.showPrice = true; draw(); });
    $("#cmp")?.addEventListener("click", () => {
      const w = s.verdict.warning, n = parseNumber($("#num").value);
      if (n == null) return;
      const p = judge({ kind: w.kind, price: { currency: "USD", amount: n } }, [w]);
      if (p.warning) s.verdict = { ...s.verdict, verdict: p.verdict === "fair" ? s.verdict.verdict : p.verdict, why: `${p.why} ${w.whatHappens || ""}`.trim() };
      s.showPrice = false; draw();
    });
  };

  async function takePhoto(file) {
    if (!file) return;
    s.photo = URL.createObjectURL(file);
    if (!scams.length) { s.step = "describe"; s.note = `Nothing saved for ${city} yet. Go online once so Beacon can look it up.`; return draw(); }
    if (!(await aiReady())) { s.step = "describe"; s.note = "Photo checking isn't set up on this page, so say what you see."; return draw(); }
    s.step = "reading"; draw();
    const m = readMatch(await askAiAboutImage(matchPrompt(city, scams), file), scams);
    if (!m) { s.step = "describe"; s.note = "Couldn't check the photo. Say what you see."; return draw(); }
    s.seen = m.seen; s.verdict = verdictFor(m); s.badge = "AI checked"; s.step = "verdict"; draw();
  }

  draw();
}
