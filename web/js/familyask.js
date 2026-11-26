// The family page's "Ask how {name} is". This browser makes a key pair once (kept here only), sends the
// public half with the question, and opens the locked answer when her phone sends it. Firestore layout:
// trips/{tripId}/checkins/{id} (rules in backend/firebase/firestore.rules). The page must have opened the link first
// (js/familydata.js writes the viewer document), or the rules refuse the question.
import { firestore, signedIn } from "./firebase.js";
import { makeKeys, unseal } from "./seal.js";

const KEYS = "beacon.askerKeys", NAME = "beacon.askerName", LAST = "beacon.lastAnswerAt";
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
export const askerName = () => read(NAME) || "";
export const lastAnswerAt = () => read(LAST);

async function keys() {
  let k = read(KEYS);
  if (!k) { k = await makeKeys(); localStorage.setItem(KEYS, JSON.stringify(k)); }
  return k;
}

// Asks once. onState({status: "sending"|"waiting"|"answered"|"failed", text?, at?, answeredAt?}). Returns stop().
export async function askHow(shareId, name, onState) {
  localStorage.setItem(NAME, JSON.stringify(name));
  onState({ status: "sending" });
  const [fs, uid] = await Promise.all([firestore(), signedIn()]);
  if (!fs || !uid) { onState({ status: "failed" }); return () => {}; }
  const { db, f } = fs;
  const share = await f.getDoc(f.doc(db, "shares", shareId)).catch(() => null);
  if (!share?.exists() || share.data().revoked) { onState({ status: "failed" }); return () => {}; }
  const k = await keys(), now = Date.now();
  const ref = f.doc(f.collection(db, "trips", share.data().tripId, "checkins"));
  try {
    await f.setDoc(ref, { viewerUid: uid, askerName: name.slice(0, 40), askerKey: JSON.stringify(k.publicJwk), askedAtMillis: now, answer: null, answeredAtMillis: null });
  } catch { onState({ status: "failed" }); return () => {}; }
  onState({ status: "waiting" });
  return f.onSnapshot(ref, async (d) => {
    const q = d.data();
    if (!q?.answer) return onState({ status: "waiting" });
    try {
      const { text, at } = JSON.parse(await unseal(k.privateJwk, q.answer));
      localStorage.setItem(LAST, JSON.stringify(q.answeredAtMillis));
      onState({ status: "answered", text, at, answeredAt: q.answeredAtMillis });
    } catch { onState({ status: "failed" }); }
  }, () => onState({ status: "waiting" })); // offline: keep waiting, Firestore reconnects by itself
}

// Her first name, as her phone wrote it on the link ("" if the link was made before names were added).
export async function travelerNameOf(shareId) {
  const fs = await firestore(); if (!fs || !(await signedIn())) return "";
  try { return (await fs.f.getDoc(fs.f.doc(fs.db, "shares", shareId))).data()?.travelerName || ""; } catch { return ""; }
}
