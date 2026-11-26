// sendText: Beacon's automatic text messages (SOS, walked into a dangerous area, stopped on the way back,
// "you've been added"), sent with Twilio so she doesn't have to press send.
// Only this app can call it (App Check), only signed-in travelers, at most LIMIT_PER_DAY texts each a day,
// and only the fixed wording in texts.js. The text itself isn't stored; the daily count is.
// Twilio keys live in Secret Manager: firebase functions:secrets:set TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { buildText, LIMIT_PER_DAY } from "./texts.js";

initializeApp();
const SID = defineSecret("TWILIO_SID"), TOKEN = defineSecret("TWILIO_TOKEN"), FROM = defineSecret("TWILIO_FROM");

export const sendText = onCall({ secrets: [SID, TOKEN, FROM], enforceAppCheck: true, region: "us-central1", maxInstances: 5 }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const { kind, ...fields } = req.data || {};
  const text = buildText(kind, fields);
  if (text.error) throw new HttpsError("invalid-argument", `Bad ${text.error}.`);

  // Daily cap, counted before sending (textLimits/{uid}; the Firestore rules give apps no access to it).
  const day = new Date().toISOString().slice(0, 10), ref = getFirestore().doc(`textLimits/${uid}`);
  await getFirestore().runTransaction(async (t) => {
    const d = (await t.get(ref)).data();
    const used = d?.day === day ? d.count : 0;
    if (used + text.to.length > LIMIT_PER_DAY) throw new HttpsError("resource-exhausted", "Too many texts today.");
    t.set(ref, { day, count: used + text.to.length, updated: FieldValue.serverTimestamp() });
  });

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
