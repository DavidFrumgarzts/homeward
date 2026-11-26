// The phone-frame demo page: picks the app and the position, scales the phone to the window, and shows
// what the phone would have texted or called (phone/frame.js and live/js/notify.js post it here).
import { APPS, PLACES, SCREEN, frameSrc, fitScale } from "./links.js";

const $ = (s) => document.querySelector(s);
const frame = $("#app"), phone = $("#phone"), slot = $("#slot");
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const saved = (k, fallback) => { try { return localStorage.getItem(`beacon.phone.${k}`) || fallback; } catch { return fallback; } };
const keep = (k, v) => { try { localStorage.setItem(`beacon.phone.${k}`, v); } catch { /* private window */ } };

const state = { app: saved("app", "live"), place: saved("place", "device") };
const appNow = () => APPS.find((a) => a.id === state.app) || APPS[0];
const placeNow = () => PLACES.find((p) => p.id === state.place) || PLACES[0];

function open(reset = false) {
  const src = frameSrc(appNow().path, { at: placeNow().at, reset });
  frame.src = src;
  $("#addr").textContent = src; $("#addr").href = src;
}

function drawPicker(box, items, current, pick, extra = () => "") {
  box.innerHTML = items.map((x) => `<button role="radio" aria-checked="${x.id === current}" data-id="${x.id}"><span class="name">${esc(x.name)}</span>${extra(x)}</button>`).join("");
  box.querySelectorAll("button").forEach((b) => (b.onclick = () => pick(b.dataset.id)));
}
function drawPanel() {
  drawPicker($("#apps"), APPS, state.app, (id) => { state.app = id; keep("app", id); drawPanel(); open(); });
  drawPicker($("#places"), PLACES, state.place, (id) => { state.place = id; keep("place", id); drawPanel(); open(); },
    (p) => `<span class="small">${p.at ? esc(p.at.replace(",", ", ")) : "default"}</span>`);
}
$("#reset").onclick = () => open(true);

// Scale: the whole phone shrinks to fit the window (never grows past 100%).
const W = SCREEN.width + 26, H = SCREEN.height + 26;
function fit() {
  const side = innerWidth > 860;
  const s = fitScale(side ? innerWidth - 320 - 48 - 32 : innerWidth - 32, side ? innerHeight - 48 : Math.max(innerHeight - 48, 500), W, H);
  phone.style.transform = s === 1 ? "none" : `scale(${s})`;
  slot.style.width = `${Math.round(W * s)}px`; slot.style.height = `${Math.round(H * s)}px`;
  $("#scale").textContent = `${Math.round(s * 100)}%`;
}
addEventListener("resize", fit);

// The status bar clock.
const tick = () => { const d = new Date(); $("#time").textContent = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`; };
setInterval(tick, 10000);

// What the phone would have done.
function describe(m) {
  if (m.kind === "sms") return { cls: "sms", what: `Would text ${m.to.join(", ") || "nobody"}`, body: m.body || "(empty message)" };
  if (m.kind === "tel") return { cls: "tel", what: `Would call ${m.to.join(", ")}`, body: "" };
  if (m.kind === "alert") {
    const f = m.fields || {};
    const body = f.message || (f.place ? `Entered ${f.place}` : "") || (f.minutes ? `Stopped for ${f.minutes} min` : "");
    const where = Number.isFinite(f.lat) ? `\nAt ${f.lat.toFixed(5)}, ${f.lng.toFixed(5)}` : "";
    return { cls: "sms", what: `Beacon would alert ${(m.names || []).join(", ")} (${m.what})`, body: `${body}${where}` };
  }
  if (m.kind === "camera") return { cls: "sms", what: "Camera allowed (test mode)", body: "No camera is used. Scan takes an uploaded photo." };
  return null;
}
addEventListener("message", (e) => {
  if (e.origin !== location.origin || e.source !== frame.contentWindow || !e.data?.beaconPhone) return;
  const d = describe(e.data);
  if (!d) return;
  const toast = Object.assign(document.createElement("div"), { className: `toast ${d.cls}` });
  toast.innerHTML = `<div class="what">${esc(d.what)}</div>${d.body ? `<div class="body">${esc(d.body)}</div>` : ""}`;
  toast.onclick = () => toast.remove();
  $("#toasts").prepend(toast);
  setTimeout(() => toast.remove(), 7000);
  const log = $("#log");
  log.querySelector(".empty")?.remove();
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
  log.insertAdjacentHTML("afterbegin", `<li><b>${esc(d.what)}</b> <span class="small">${esc(time)}</span>${d.body ? `<div class="body">${esc(d.body)}</div>` : ""}</li>`);
  $("#clear").hidden = false;
});
$("#clear").onclick = () => { $("#log").innerHTML = '<li class="small empty">Nothing yet.</li>'; $("#clear").hidden = true; };

drawPanel(); fit(); tick(); open();
