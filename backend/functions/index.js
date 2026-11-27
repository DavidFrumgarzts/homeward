// sendText: Beacon's automatic text messages (SOS, walked into a dangerous area, stopped on the way back,
// "you've been added"), sent with Twilio so she doesn't have to press send.
// Only this app can call it (App Check), only signed-in travelers, at most LIMIT_PER_DAY texts each a day,
// and only the fixed wording in texts.js. The text itself isn't stored; the daily count is.
// Twilio keys live in Secret Manager: firebase functions:secrets:set TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { buildText, buildPush, LIMIT_PER_DAY } from "./texts.js";
import { staySafe, plainText, extractPrompt, readAreas, ringFrom, slugOf } from "./areas.js";

initializeApp();
const GEMINI = defineSecret("GEMINI_KEY"); // free Google AI Studio key (a project with no billing): never sent to browsers
const SID = defineSecret("TWILIO_SID"), TOKEN = defineSecret("TWILIO_TOKEN"), FROM = defineSecret("TWILIO_FROM");

export const sendText = onCall({ secrets: [SID, TOKEN, FROM], enforceAppCheck: true, region: "us-central1", maxInstances: 5 }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const { kind, ...fields } = req.data || {};
  const text = buildText(kind, fields);
  if (text.error) throw new HttpsError("invalid-argument", `Bad ${text.error}.`);

  await countToday(uid, text.to.length);

  const auth = "Basic " + Buffer.from(`${SID.value()}:${TOKEN.value()}`).toString("base64");
  const sent = [], failed = [];
  for (const to of text.to) {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID.value()}/Messages.json`, {
      method: "POST", headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: to, From: FROM.value(), Body: text.body }),
    }).catch(() => null);
    (r?.ok ? sent : failed).push(to);
    if (!r?.ok) console.warn("twilio", r?.status, (await r?.json().catch(() => ({})))?.code);
  }
  if (!sent.length) throw new HttpsError("unavailable", "The text service didn't take it.");
  return { sent, failed };
});

// Daily cap, counted before sending (textLimits/{uid}; the Firestore rules give apps no access to it).
async function countToday(uid, n) {
  const day = new Date().toISOString().slice(0, 10), ref = getFirestore().doc(`textLimits/${uid}`);
  await getFirestore().runTransaction(async (t) => {
    const d = (await t.get(ref)).data();
    const used = d?.day === day ? d.count : 0;
    if (used + n > LIMIT_PER_DAY) throw new HttpsError("resource-exhausted", "Too many alerts today.");
    t.set(ref, { day, count: used + n, updated: FieldValue.serverTimestamp() });
  });
}

// alertFamily: a push notification to her trusted people who turned on alerts on their family page
// (trips/{tripId}/watchers/{uid}: their browser's push token and the share they opened). Free, no texts.
// Only the trip's owner can send, only Beacon's fixed wording, and only to links that are still on.
export const alertFamily = onCall({ enforceAppCheck: true, region: "us-central1", maxInstances: 5 }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const { kind, tripId, ...fields } = req.data || {};
  if (typeof tripId !== "string" || !/^[A-Za-z0-9-]{8,64}$/.test(tripId)) throw new HttpsError("invalid-argument", "Bad trip.");
  const db = getFirestore(), trip = await db.doc(`trips/${tripId}`).get();
  if (!trip.exists || trip.data().ownerUid !== uid) throw new HttpsError("permission-denied", "Not your trip.");
  const push = buildPush(kind, { ...fields, name: trip.data().travelerName || fields.name });
  if (push.error) throw new HttpsError("invalid-argument", `Bad ${push.error}.`);

  const watchers = (await db.collection(`trips/${tripId}/watchers`).get()).docs;
  const live = [];
  for (const w of watchers) {
    const share = await db.doc(`shares/${w.data().shareId}`).get();
    if (share.exists && share.data().tripId === tripId && !share.data().revoked) live.push(w);
  }
  if (!live.length) return { sent: 0 };
  await countToday(uid, live.length);
  const res = await getMessaging().sendEach(live.map((w) => ({
    token: w.data().token,
    webpush: {
      notification: { title: push.title, body: push.body, tag: `beacon-${kind}`, renotify: true, requireInteraction: kind === "sos" },
      data: { link: `https://homeward-6999c.web.app/f/${w.data().shareId}` },
      fcmOptions: { link: `https://homeward-6999c.web.app/f/${w.data().shareId}` },
    },
  })));
  // Tokens the browser threw away: forget them.
  await Promise.all(res.responses.map((r, i) => (!r.success && /registration-token-not-registered|invalid-argument/.test(r.error?.code || "") ? live[i].ref.delete() : null)));
  return { sent: res.successCount };
});

// ---------- Free AI (Gemini API free tier, key in Secret Manager) ----------
// Google's paid route (Vertex) refuses this project while its billing account is a free trial, and David doesn't
// want to pay: the app's cloud AI goes through this function instead. The free tier may use prompts to improve
// Google's products, so private things (booking emails, check-in answers) stay on the phone's own AI (js/ai.js).
const MODEL = "gemini-3.5-flash-lite", AI_PER_DAY = 300;
async function gemini(parts) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(GEMINI.value())}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts }] }),
  });
  const d = await r.json().catch(() => ({}));
  if (r.status === 429) throw new HttpsError("resource-exhausted", "The free AI is busy. Try again in a minute.");
  if (!r.ok) throw new HttpsError("unavailable", "The AI didn't answer.");
  return (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
}
async function countAi(uid) {
  const day = new Date().toISOString().slice(0, 10), ref = getFirestore().doc(`aiLimits/${uid}`);
  await getFirestore().runTransaction(async (t) => {
    const d = (await t.get(ref)).data(), used = d?.day === day ? d.count : 0;
    if (used >= AI_PER_DAY) throw new HttpsError("resource-exhausted", "Too many AI questions today.");
    t.set(ref, { day, count: used + 1 });
  });
}

// askGemini: {prompt, image?: {data (base64), mimeType}} -> {text}. App Check and sign-in, 300 a day each.
export const askGemini = onCall({ secrets: [GEMINI], enforceAppCheck: true, region: "us-central1", maxInstances: 10 }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const { prompt, image } = req.data || {};
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 40000) throw new HttpsError("invalid-argument", "Bad prompt.");
  const parts = [{ text: prompt }];
  if (image) {
    if (typeof image.data !== "string" || image.data.length > 7_000_000 || !/^image\/(jpeg|png|webp|heic|heif)$/.test(image.mimeType || "")) throw new HttpsError("invalid-argument", "Bad image.");
    parts.push({ inline_data: { mime_type: image.mimeType, data: image.data } });
  }
  await countAi(uid);
  return { text: await gemini(parts) };
});

// ---------- Areas to avoid at night, researched per city (areas.js has the rules) ----------
const UA = { "User-Agent": "BeaconSafetyApp/1.0 (https://homeward-6999c.web.app)" };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const getJson = (url) => fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

async function wikivoyage(city) {
  const out = [], titles = [city];
  const sub = await getJson(`https://en.wikivoyage.org/w/api.php?action=query&list=prefixsearch&pssearch=${encodeURIComponent(city + "/")}&pslimit=8&format=json`);
  for (const p of sub?.query?.prefixsearch || []) if (p.title.startsWith(`${city}/`)) titles.push(p.title);
  for (const title of titles.slice(0, 7)) {
    const d = await getJson(`https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&redirects=1&prop=wikitext&format=json&formatversion=2`);
    const text = plainText(staySafe(d?.parse?.wikitext));
    if (text.length > 80) out.push({ site: "en.wikivoyage.org", url: `https://en.wikivoyage.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`, type: "traveler", text });
  }
  return out;
}
async function ukAdvice(city, country) {
  const slug = country.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  const d = await getJson(`https://www.gov.uk/api/content/foreign-travel-advice/${slug}`);
  const parts = (d?.details?.parts || []).filter((p) => /safety|regional/.test(p.slug));
  // Only the paragraphs that name the city: the rest is about the whole country.
  const paras = parts.flatMap((p) => String(p.body).split(/<\/p>|<\/li>/)).map(plainText).filter((t) => t.toLowerCase().includes(city.toLowerCase()));
  return paras.length ? [{ site: "gov.uk", url: `https://www.gov.uk/foreign-travel-advice/${slug}/safety-and-security`, type: "official", text: paras.join(" ") }] : [];
}
async function shapeOf(place, city, center) {
  const d = 0.25, vb = center ? `&viewbox=${center[1] - d},${center[0] + d},${center[1] + d},${center[0] - d}&bounded=1` : "";
  const hit = (await getJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&polygon_geojson=1&polygon_threshold=0.0002&accept-language=en${vb}&q=${encodeURIComponent(`${place}, ${city}`)}`))?.[0];
  return hit ? ringFrom(hit.geojson) || ringFrom({ type: "Point", coordinates: [+hit.lon, +hit.lat] }) : null;
}

// researchAreas: {city, country} -> {areas: [{name, why, fromHour, toHour, sources, official, ring: [[lat, lng]]}]}.
// Cached for everyone in cityAreas/{city--country} for 14 days (the rules give apps no access to it).
export const researchAreas = onCall({ secrets: [GEMINI], enforceAppCheck: true, region: "us-central1", maxInstances: 3, timeoutSeconds: 180 }, async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const city = String(req.data?.city || "").trim().slice(0, 80), country = String(req.data?.country || "").trim().slice(0, 80);
  if (!city || !country) throw new HttpsError("invalid-argument", "City and country, please.");
  const ref = getFirestore().doc(`cityAreas/${slugOf(city, country)}`), cached = (await ref.get()).data();
  if (cached && Date.now() - cached.savedAt < 14 * 864e5) return { areas: JSON.parse(cached.areasJson), cached: true };
  await countAi(req.auth.uid);

  const sources = [...(await wikivoyage(city)), ...(await ukAdvice(city, country))].map((s, i) => ({ ...s, id: `S${i + 1}` }));
  let areas = [];
  if (sources.length) {
    const found = readAreas(await gemini([{ text: extractPrompt(city, country, sources) }]), sources);
    const c = (await getJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(`${city}, ${country}`)}`))?.[0];
    const center = c ? [+c.lat, +c.lon] : null;
    for (const a of found) {
      await pause(1100); // Nominatim: at most one request a second
      const ring = await shapeOf(a.place, city, center);
      if (ring) areas.push({ ...a, city, ring });
    }
  }
  await ref.set({ city, country, savedAt: Date.now(), sources: sources.map((s) => s.url), areasJson: JSON.stringify(areas) });
  return { areas, cached: false };
});
