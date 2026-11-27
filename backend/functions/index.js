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

initializeApp();
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
