// First launch: Figma "Onboarding v3". Each screen shows Beacon solving a problem, then asks for one thing.
// Order and skip rules: js/onboarding.js. Pictures: live/img/ (exported from Figma). Text and buttons are HTML.
import { store, cleanPhone, shortPhone } from "../../js/store.js";
import { nextStep, skipTo } from "../../js/onboarding.js";
import { SAMPLE_BOOKING } from "../../js/booking.js";
import { checkBooking } from "./bookingflow.js";
import { gmailAvailable, readGmailBookings } from "./gmail.js";
import { checkinLink } from "./answering.js";
import { googleMapsLink } from "../../js/trip.js";

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TINTS = [["var(--blue-tint)", "var(--blue)"], ["var(--amber-tint)", "var(--amber)"], ["var(--green-tint)", "var(--green)"]];

// ctx: { city: () => ({name, country}), counts: () => ({hospitals, police, pharmacies, scams, researching}),
//        onPosition(pos), done() }
export function onboarding(app, ctx) {
  const $ = (s) => app.querySelector(s);
  let step = "night", booking = { state: "idle" }, note = "", readyTimer = null;
  const go = (s) => { step = s; note = ""; draw(); window.scrollTo(0, 0); };
  const next = () => { const n = nextStep(step, { contacts: store.contacts.length }); n === null ? ctx.done() : go(n); };
  const top = (left = "") => `<div class="onb-top"><span class="small">${left}</span><button class="link small" id="skip" style="color:var(--muted)">Skip</button></div>`;
  const bubble = (t) => `<div class="bubble you" style="align-self:flex-end">${t}</div>`;
  const card = (title, detail, tint, color, glyph) => `<div class="card"><div class="tile" style="background:${tint};color:${color};width:36px;height:36px;border-radius:12px">${glyph}</div><div><div class="label">${title}</div><p class="small">${detail}</p></div></div>`;

  const screens = {
    night: () => `${top()}<div class="stamp onb-pad">RAJASTHAN, INDIA</div>
      <img class="onb-img" src="img/onb-night.png" alt="Map: her hotel, and the nearest hospital 8 hours away by road">
      <div class="onb-pad stack"><h2 class="onb-story">She got sick at 2 a.m. in a small town in India. The nearest hospital was 8 hours away, and nobody had told her when she booked.</h2>
      <button class="btn" id="go">See it with Beacon</button></div>`,

    booking: () => {
      if (booking.state === "busy") return `${top("With Beacon, before the trip")}<div class="onb-pad stack"><h1>Checking your booking</h1><p class="small" aria-live="polite">${esc(booking.step)}</p></div>`;
      if (booking.state === "done") {
        const r = booking.result, b = r.booking, w = r.warning;
        return `${top("With Beacon, before the trip")}<div class="onb-pad stack">
          ${card("Found your booking", esc(`${b.hotel}${b.checkIn ? `, ${b.checkIn} to ${b.checkOut}` : ""}`), "var(--blue-tint)", "var(--blue)", "✉")}
          <div class="card" style="${w.warn ? "" : ""}"><div class="tile" style="background:${w.warn ? "var(--amber-tint)" : "var(--green-tint)"};color:${w.warn ? "var(--amber)" : "var(--green)"};width:36px;height:36px;border-radius:12px">${w.warn ? "!" : "✓"}</div>
            <div><div class="label">${esc(w.text)}</div><p class="small">${r.hospitals ? `${r.hospitals.length} hospitals within 60 km` : "Hospitals not checked yet"}${r.nearest ? ` · <a class="link" target="_blank" rel="noopener" href="${googleMapsLink(r.at, r.nearest.at)}">Drive there in Google Maps</a>` : ""}</p></div></div>
          <p class="small">${r.sample ? "This was the sample, so nothing was saved." : "Saved on this phone, with the drive to the nearest hospital, so it works with no signal."} Hospitals and roads © OpenStreetMap contributors.</p>
          <div class="grow"></div><button class="btn" id="go">Next</button></div>`;
      }
      return `${top("With Beacon, before the trip")}
        <img class="onb-img" src="img/onb-booking.png" alt="Map: the hotel, police and embassy inside a 30-minute drive, and no hospital">
        <div class="onb-pad stack">
          ${card("No hospital within a 30-min drive?", "Beacon finds your hotel in your booking and tells you before you go.", "var(--amber-tint)", "var(--amber)", "!")}
          ${booking.gmail ? '<button class="btn" id="gmail">Let Beacon find my bookings</button>' : ""}
          <button class="btn ${booking.gmail ? "quiet" : ""}" id="sample">Try a sample booking</button>
          ${booking.paste ? `<textarea class="field" id="text" placeholder="Paste your booking confirmation"></textarea><button class="btn quiet" id="check">Check this booking</button>` : '<button class="link left" id="paste">Paste a booking myself</button>'}
          <p class="error">${esc(note)}</p>
          <p class="small">Beacon reads only booking emails. The AI reads them to find your hotel. Nothing is kept on our servers.</p>
          <div class="grow"></div><button class="link center-self" id="go">Not now</button></div>`;
    },

    location: () => `${top("Walking back at night")}<div class="onb-pad">${bubble("Way back to my hotel")}</div>
      <img class="onb-img" src="img/onb-way.png" alt="Map: the fastest way goes through a dangerous area; Beacon's way stays on the main road">
      <div class="onb-pad stack">${card("Beacon · 3 minutes longer, on busy streets", "Tell Beacon where you're going and it saves the way there and back, so it works with no signal. It goes around areas marked as dangerous at night.", "var(--blue-tint)", "var(--blue)", "→")}
      <button class="btn" id="allow">Allow location</button><p class="error">${esc(note)}</p>
      <p class="small center-text">Your location stays on your phone. Your trusted people get it only when they ask or you send an SOS.</p></div>`,

    nosignal: () => `${top("A week later, in the small town")}<div class="onb-pad stack">
      <span class="chip" style="align-self:flex-start">✈ Airplane mode · no signal</span>${bubble("I feel very sick. Where do I go?")}
      <div class="card col"><h2>Call 108 for an ambulance now</h2><p>The nearest hospital is AIIMS Jodhpur, 3 h 40 by car. The route is saved on your phone.</p>
        <img class="onb-img" style="border-radius:14px" src="img/onb-nosignal.png" alt="The saved route to the hospital"><span class="badge">Saved on this phone · no internet used</span></div>
      <p class="small">An example. When you check a booking or arrive somewhere, Beacon saves the drive to the nearest hospital, so this answer works with no signal.</p>
      <div class="grow"></div><button class="btn" id="go">Next</button></div>`,

    people: () => `${top()}<div class="onb-pad stack"><h1>Add people who can check on you</h1>
      ${card("They can ask how you are, any time", "Beacon answers for you with where you are and where you came from. With no signal it keeps trying every minute.", "var(--blue-tint)", "var(--blue)", "?")}
      ${card("In an SOS they get everything", "Where you are, a live map and your message, by text.", "var(--red-tint)", "var(--red)", "!")}
      ${card("Only they can read it", "Answers are locked for them. Nothing readable is kept on Beacon's servers.", "var(--green-tint)", "var(--green)", "✓")}
      <input class="field" id="me" placeholder="Your first name" value="${esc(store.name)}" autocomplete="given-name" aria-label="Your first name">
      ${store.contacts.map((c, i) => { const [t, col] = TINTS[i % 3]; return `<div class="card"><div class="tile" style="background:${t};color:${col};font-weight:600">${esc(c.name[0]?.toUpperCase())}</div><div class="grow"><div class="label">${esc(c.name)}</div><p class="small">${esc(shortPhone(c.phone))}</p></div><button class="link small" data-del="${i}">Remove</button></div>`; }).join("")}
      ${"contacts" in navigator && "select" in navigator.contacts ? '<button class="btn quiet" id="pick">Choose from contacts</button>' : ""}
      <input class="field" id="cname" placeholder="Their name, e.g. Mom"><input class="field" id="cphone" placeholder="Phone with country code, e.g. +972…" inputmode="tel">
      <button class="link left" id="add">+ Add person</button><p class="error">${esc(note)}</p>
      <div class="grow"></div>
      ${store.contacts.length ? '<button class="btn quiet" id="link">Send them their check-in link</button>' : ""}
      <button class="btn" id="go" ${store.contacts.length ? "" : "disabled"}>Continue</button>
      <p class="small center-text">You see every answer Beacon sends, and you can pause it any time.</p></div>`,

    late: () => `${top("Walking back late at night")}<div class="onb-pad"><div class="card"><i class="dot" style="background:var(--yellow)"></i><span class="label">After 9 p.m., safe places near you light up.</span></div></div>
      <img class="onb-img" src="img/onb-late.png" alt="Map: police, a 24-hour pharmacy and the hotel ringed in yellow">
      <div class="onb-pad stack"><p class="small">Police stations, hospitals and 24-hour pharmacies near you blink yellow on the map at night.</p><button class="btn" id="go">Next</button></div>`,

    scan: () => `${top("Taking out cash at night")}<div class="onb-pad stack">
      <div class="bubble you onb-photo" style="align-self:flex-end"><img src="img/onb-atm.jpg" alt="A street ATM with a bulky card reader fitted over the slot"><span>Is this legit?</span></div>
      <div class="card col"><h2>It's a scam. Don't use this ATM.</h2><p>There's a skimmer on the card slot: a fake reader that copies your card, while a hidden camera films your PIN.</p>
        <p class="small" style="background:var(--amber-tint);padding:10px 12px;border-radius:12px;color:var(--ink)">Cancel, take your card and walk away. Use an ATM inside a bank, and cover the keypad when you type your PIN.</p></div>
      <div class="grow"></div><button class="btn" id="allow">Allow camera</button><p class="error">${esc(note)}</p>
      <p class="small center-text">Only when you take a photo to check. Beacon doesn't keep your photos.</p></div>`,

    ready: () => {
      const c = ctx.city(), n = ctx.counts(), name = c.name || "your city";
      const row = (title, detail, done) => `<div class="card"><div class="grow"><div class="label">${title}</div><p class="small">${detail}</p></div><span class="stamp" style="color:${done ? "var(--green)" : "var(--muted)"}">${done ? "DONE" : "…"}</span></div>`;
      return `<div class="onb-pad stack" style="padding-top:56px"><h1>Getting ${esc(name)} ready</h1>
        ${!c.name ? '<p class="small">Turn on location so Beacon knows which city you\'re in. You can start now; it fills in by itself.</p>' : ""}
        ${row(`${n.hospitals} hospitals`, n.nearestHospital ? `Nearest: ${esc(n.nearestHospital)}` : "Near you, open 24 hours", n.placesDone)}
        ${row(`${n.police} police stations`, "Near you", n.placesDone)}
        ${row(`${n.pharmacies} 24-hour pharmacies`, "Near you", n.placesDone)}
        ${row(`${n.scams} scams travelers report`, n.researching ? "Looking up reports…" : "Checked when you scan a photo", !n.researching && n.scams > 0)}
        <p class="small">Saved on your phone, so it all works with no signal.</p>
        <div class="grow"></div><button class="btn" id="go">Start exploring${c.name ? ` ${esc(c.name)}` : ""}</button></div>`;
    },
  };

  function draw() {
    app.innerHTML = `<div class="onb">${screens[step]()}</div>`;
    $("#skip")?.addEventListener("click", () => go(skipTo(step)));
    $("#go")?.addEventListener("click", () => { if (step === "people") savePeople(); next(); });
    wire[step]?.();
  }

  const runBooking = async (text) => {
    booking = { ...booking, state: "busy", step: "Reading the booking…" }; draw();
    const r = await checkBooking(text, (s) => { booking.step = s; if (step === "booking") draw(); });
    if (r.error) { booking = { ...booking, state: "idle" }; note = { "no-ai": "Beacon's AI isn't available right now. Try again in a moment.", unreadable: "Beacon couldn't find a hotel and town in that text.", "not-found": "Beacon couldn't find that hotel on the map." }[r.error]; return draw(); }
    booking = { ...booking, state: "done", result: r }; draw();
  };
  const savePeople = () => { store.name = $("#me")?.value || store.name; };
  const wire = {
    booking: () => {
      $("#sample")?.addEventListener("click", () => runBooking(SAMPLE_BOOKING));
      $("#paste")?.addEventListener("click", () => { booking.paste = true; draw(); });
      $("#check")?.addEventListener("click", () => { const t = $("#text").value.trim(); if (t) runBooking(t); });
      $("#gmail")?.addEventListener("click", async () => {
        const mails = await readGmailBookings();
        if (mails.error) { note = { denied: "Gmail wasn't allowed. You can try the sample or paste a booking.", none: "No hotel bookings found in the last 6 months.", failed: "Couldn't reach Gmail. Try the sample or paste a booking." }[mails.error]; return draw(); }
        runBooking(mails.slice(0, 2).join("\n\n----\n\n"));
      });
    },
    location: () => $("#allow").addEventListener("click", () => {
      if (!navigator.geolocation) return next();
      navigator.geolocation.getCurrentPosition((pos) => { ctx.onPosition(pos); next(); }, () => { note = "Location is off. You can turn it on later in your browser's settings."; draw(); setTimeout(() => step === "location" && next(), 1800); }, { enableHighAccuracy: true, timeout: 15000 });
    }),
    people: () => {
      const add = () => {
        const name = $("#cname").value.trim(), phone = cleanPhone($("#cphone").value);
        if (!name && !$("#cphone").value.trim()) return true;
        if (!name || !phone) { note = "Add a name and a phone number that starts with + and the country code."; draw(); return false; }
        savePeople(); store.addContact(name, phone); return true;
      };
      $("#add").addEventListener("click", () => { if (add()) draw(); });
      app.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { store.removeContact(+b.dataset.del); draw(); }));
      $("#pick")?.addEventListener("click", async () => {
        try { for (const c of await navigator.contacts.select(["name", "tel"], { multiple: true })) { const p = (c.tel || []).map(cleanPhone).find(Boolean); if (p) store.addContact((c.name || [])[0] || p, p); } } catch { /* closed */ }
        draw();
      });
      $("#link")?.addEventListener("click", async () => {
        savePeople();
        const link = await checkinLink(ctx.city());
        if (!link) { note = "Beacon needs a connection once to make the link."; return draw(); }
        location.href = `sms:${store.contacts.map((c) => c.phone).join(",")}?&body=${encodeURIComponent(`${store.name || "I"} added you to Beacon. Open this to see how ${store.name || "I"} ${store.name ? "is" : "am"} any time: ${link}`)}`;
      });
      // "Continue" with names typed but not added yet: add them first.
      $("#go").addEventListener("click", (e) => { if (!add()) e.stopImmediatePropagation(); }, { capture: true });
      $("#cphone").addEventListener("input", () => { if ($("#cname").value.trim() && cleanPhone($("#cphone").value)) $("#go").disabled = false; });
    },
    scan: () => $("#allow").addEventListener("click", async () => {
      try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); s.getTracks().forEach((t) => t.stop()); next(); }
      catch { note = "Camera is off. You can still pick a photo from your gallery when you scan."; draw(); setTimeout(() => step === "scan" && next(), 1800); }
    }),
    // One timer for the whole screen (draw() runs wire.ready again on every tick).
    ready: () => { readyTimer ??= setInterval(() => { if (step !== "ready" || !app.querySelector(".onb")) { clearInterval(readyTimer); readyTimer = null; return; } draw(); }, 2000); },
  };

  gmailAvailable().then((ok) => { booking.gmail = ok; if (step === "booking") draw(); });
  draw();
}
