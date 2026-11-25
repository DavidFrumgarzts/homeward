// Checks firestore.rules against the Firestore emulator: who can read and write what.
// Run with `npm test` in firebase/ (it starts the emulator for you).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from "firebase/firestore";

const rules = readFileSync(fileURLToPath(new URL("../firestore.rules", import.meta.url)), "utf8");
const SHARE = "0123456789abcdef0123456789abcdef", OTHER_SHARE = "fedcba9876543210fedcba9876543210";
let env;

const trip = (owner) => ({ ownerUid: owner, travelerName: "Noa", city: "Rio de Janeiro", country: "Brazil", packId: null, platform: "android", createdAtMillis: 1 });
const incident = (owner, tripId) => ({
  ownerUid: owner, tripId, travelerName: "Noa", city: "Rio de Janeiro", country: "Brazil", phase: "SosActive", method: "SosButton",
  userConfirmed: true, description: "being followed", situation: "followed", triggerReasons: [], message: "Noa needs help.",
  emergency: { police: "190", ambulance: "192", embassyName: "Consulate", embassyPhone: "+55 21 3823-2000" },
  platform: "android", startedAtMillis: 1, alertSentAtMillis: 2, resolvedAtMillis: null, updatedAtMillis: 2,
});
const update = (owner) => ({ ownerUid: owner, kind: "alert", lat: -22.9095, lng: -43.1842, takenAtMillis: 1, accuracyMeters: 8, batteryPercent: 60, pointsHeld: 0, createdAtMillis: 2 });
const share = (owner, tripId, revoked = false) => ({ tripId, ownerUid: owner, contactLabel: "Mom", createdAtMillis: 1, revoked });

const as = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

// Noa owns trip1 with one incident, one update and a share; Dana owns trip2 with its own share.
async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "trips/trip1"), trip("noa"));
    await setDoc(doc(db, "trips/trip1/incidents/inc1"), incident("noa", "trip1"));
    await setDoc(doc(db, "trips/trip1/incidents/inc1/updates/u1"), update("noa"));
    await setDoc(doc(db, `shares/${SHARE}`), share("noa", "trip1"));
    await setDoc(doc(db, "packs/pack1"), { ownerUid: "noa", city: "Rio de Janeiro", country: "Brazil", pack: {}, createdAtMillis: 1 });
    await setDoc(doc(db, "trips/trip2"), trip("dana"));
    await setDoc(doc(db, "trips/trip2/incidents/inc2"), incident("dana", "trip2"));
    await setDoc(doc(db, `shares/${OTHER_SHARE}`), share("dana", "trip2"));
  });
}
// Mom opens the family link: she claims a viewer document with the share id.
const claim = (uid = "mom", shareId = SHARE, tripId = "trip1") =>
  setDoc(doc(as(uid), `trips/${tripId}/viewers/${uid}`), { shareId, createdAtMillis: 5 });

beforeAll(async () => { env = await initializeTestEnvironment({ projectId: "demo-beacon", firestore: { rules } }); });
afterAll(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); await seed(); });

describe("shares (family links)", () => {
  test("nobody can list shares, not even their owner", async () => {
    await assertFails(getDocs(collection(as("mom"), "shares")));
    await assertFails(getDocs(collection(as("noa"), "shares")));
  });
  test("a signed-in user can get one share by its id", async () => { await assertSucceeds(getDoc(doc(as("mom"), `shares/${SHARE}`))); });
  test("someone not signed in cannot", async () => { await assertFails(getDoc(doc(anon(), `shares/${SHARE}`))); });
  test("only the trip's owner can create a share for it", async () => {
    const id = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    await assertSucceeds(setDoc(doc(as("noa"), `shares/${id}`), share("noa", "trip1")));
    await assertFails(setDoc(doc(as("mom"), "shares/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"), share("mom", "trip1")));
    await assertFails(setDoc(doc(as("noa"), "shares/cccccccccccccccccccccccccccccccc"), share("noa", "trip2")));
  });
  test("a share id must be 32 hex characters", async () => { await assertFails(setDoc(doc(as("noa"), "shares/short"), share("noa", "trip1"))); });
  test("a contact cannot change or delete a share; the owner can turn it off", async () => {
    await assertFails(updateDoc(doc(as("mom"), `shares/${SHARE}`), { revoked: true }));
    await assertFails(deleteDoc(doc(as("mom"), `shares/${SHARE}`)));
    await assertSucceeds(updateDoc(doc(as("noa"), `shares/${SHARE}`), { revoked: true }));
    await assertFails(updateDoc(doc(as("noa"), `shares/${SHARE}`), { tripId: "trip2" }));
  });
});

describe("a contact with a family link", () => {
  test("sees nothing before opening the link", async () => {
    await assertFails(getDoc(doc(as("mom"), "trips/trip1/incidents/inc1")));
    await assertFails(getDocs(collection(as("mom"), "trips/trip1/incidents")));
  });
  test("can claim only their own viewer document, with a share that points at that trip", async () => {
    await assertSucceeds(claim());
    await assertFails(setDoc(doc(as("mom"), "trips/trip1/viewers/someone-else"), { shareId: SHARE, createdAtMillis: 5 }));
    await assertFails(claim("eve", OTHER_SHARE, "trip1"));                         // a real share, but for another trip
    await assertFails(claim("eve", "00000000000000000000000000000000", "trip1")); // no such share
    await assertFails(setDoc(doc(as("eve"), "trips/trip1/viewers/eve"), { shareId: SHARE, createdAtMillis: 5, admin: true }));
  });
  test("then reads that trip's incidents and updates", async () => {
    await claim();
    await assertSucceeds(getDoc(doc(as("mom"), "trips/trip1/incidents/inc1")));
    await assertSucceeds(getDocs(collection(as("mom"), "trips/trip1/incidents")));
    await assertSucceeds(getDocs(collection(as("mom"), "trips/trip1/incidents/inc1/updates")));
  });
  test("and nothing else: not the trip, not packs, not another trip, not everyone's incidents", async () => {
    await claim();
    await assertFails(getDoc(doc(as("mom"), "trips/trip1")));
    await assertFails(getDoc(doc(as("mom"), "packs/pack1")));
    await assertFails(getDoc(doc(as("mom"), "trips/trip2/incidents/inc2")));
    await assertFails(getDocs(collection(as("mom"), "trips/trip2/incidents")));
    await assertFails(getDocs(collectionGroup(as("mom"), "incidents")));
    await assertFails(getDocs(collection(as("mom"), "trips/trip1/viewers")));
  });
  test("cannot write incidents, updates, trips or shares", async () => {
    await claim();
    await assertFails(setDoc(doc(as("mom"), "trips/trip1/incidents/inc1"), incident("mom", "trip1")));
    await assertFails(updateDoc(doc(as("mom"), "trips/trip1/incidents/inc1"), { phase: "Resolved" }));
    await assertFails(setDoc(doc(as("mom"), "trips/trip1/incidents/inc1/updates/u9"), update("mom")));
    await assertFails(deleteDoc(doc(as("mom"), "trips/trip1/incidents/inc1/updates/u1")));
    await assertFails(updateDoc(doc(as("mom"), "trips/trip1"), { travelerName: "x" }));
    await assertFails(setDoc(doc(as("mom"), "shares/dddddddddddddddddddddddddddddddd"), share("mom", "trip1")));
  });
  test("is cut off when the share is turned off", async () => {
    await claim();
    await updateDoc(doc(as("noa"), `shares/${SHARE}`), { revoked: true });
    await assertFails(getDoc(doc(as("mom"), "trips/trip1/incidents/inc1")));
    await assertFails(getDocs(collection(as("mom"), "trips/trip1/incidents/inc1/updates")));
    await assertFails(claim("late"));
  });
  test("is cut off when the share is deleted", async () => {
    await claim();
    await deleteDoc(doc(as("noa"), `shares/${SHARE}`));
    await assertFails(getDoc(doc(as("mom"), "trips/trip1/incidents/inc1")));
  });
});

describe("the owner", () => {
  test("reads and writes her own trip, incidents, updates and packs", async () => {
    const db = as("noa");
    await assertSucceeds(getDoc(doc(db, "trips/trip1")));
    await assertSucceeds(updateDoc(doc(db, "trips/trip1/incidents/inc1"), { phase: "Resolved", resolvedAtMillis: 9, updatedAtMillis: 9 }));
    await assertSucceeds(setDoc(doc(db, "trips/trip1/incidents/inc1/updates/u2"), { ...update("noa"), kind: "update" }));
    await assertSucceeds(getDoc(doc(db, "packs/pack1")));
    await assertSucceeds(setDoc(doc(db, "packs/pack2"), { ownerUid: "noa", city: "Lima", country: "Peru", pack: {}, createdAtMillis: 1 }));
  });
  test("can send a new trip, its share, incident and first update together (a phone coming back online)", async () => {
    const db = as("noa"), batch = writeBatch(db);
    batch.set(doc(db, "trips/trip9"), trip("noa"));
    batch.set(doc(db, "shares/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"), share("noa", "trip9"));
    batch.set(doc(db, "trips/trip9/incidents/inc9"), incident("noa", "trip9"));
    batch.set(doc(db, "trips/trip9/incidents/inc9/updates/u1"), update("noa"));
    await assertSucceeds(batch.commit());
  });
  test("cannot write as someone else, into someone else's trip, or with a bad shape", async () => {
    const db = as("noa");
    await assertFails(setDoc(doc(db, "trips/tripX"), trip("dana")));
    await assertFails(setDoc(doc(db, "trips/trip2/incidents/incX"), incident("noa", "trip2")));
    await assertFails(setDoc(doc(db, "trips/trip1/incidents/incY"), { ...incident("noa", "trip1"), phase: "Whatever" }));
    await assertFails(setDoc(doc(db, "trips/trip1/incidents/inc1/updates/u3"), { ...update("noa"), kind: "spam" }));
    await assertFails(setDoc(doc(db, "trips/trip1/incidents/inc1/updates/u4"), { ...update("noa"), lat: "here" }));
  });
  test("other signed-in people cannot read her trip, incidents or packs", async () => {
    await assertFails(getDoc(doc(as("dana"), "trips/trip1")));
    await assertFails(getDoc(doc(as("dana"), "trips/trip1/incidents/inc1")));
    await assertFails(getDoc(doc(as("dana"), "packs/pack1")));
    await assertFails(getDocs(collection(as("dana"), "trips")));
  });
  test("nothing works without signing in", async () => {
    await assertFails(getDoc(doc(anon(), "trips/trip1")));
    await assertFails(getDoc(doc(anon(), "trips/trip1/incidents/inc1")));
    await assertFails(setDoc(doc(anon(), "trips/tripZ"), trip("noa")));
  });
});
