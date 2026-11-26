// Browser smoke tests against the Firebase emulators (run with `npm run test:e2e`).
// Every page is opened with ?emu, which makes it talk to the local emulators with a made-up project
// instead of the real one, and keeps AI off (so answers come from the plain rules).
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, collectionGroup, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";

const demo = JSON.parse(readFileSync(new URL("../../fixtures/demo-incident.json", import.meta.url), "utf8"));
const SHARE = "0123456789abcdef0123456789abcdef";
let env;
// Reads and writes the emulator's database directly, past the rules (the phone's side of the story).
const admin = async (work) => { let result; await env.withSecurityRulesDisabled(async (ctx) => { result = await work(ctx.firestore()); }); return result; };

test.beforeAll(async () => { env = await initializeTestEnvironment({ projectId: "demo-beacon", firestore: { host: "127.0.0.1", port: 8080 } }); });
test.beforeEach(async () => { await env.clearFirestore(); });
test.afterAll(async () => { await env.cleanup(); });

test("traveler: setup, Ask Beacon, SOS, and the family page it creates", async ({ browser }) => {
  const context = await browser.newContext({ permissions: ["geolocation"], geolocation: { latitude: -22.9095, longitude: -43.18421 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?emu&reset");
  await page.getByRole("button", { name: "See the same night with Beacon" }).click();
  await page.getByRole("button", { name: "Start with Beacon" }).click();
  await page.getByRole("button", { name: "Set up in 1 minute" }).click();
  await page.locator("#me").fill("Noa");
  await page.locator("#name").fill("Mom");
  await page.locator("#phone").fill("+972501234567");
  await page.getByRole("button", { name: "+ Add person" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Start exploring" }).click();

  // Ask Beacon: with no AI the plain rules answer from the saved pack, and there is no badge.
  await page.getByRole("button", { name: "Is this area OK now?" }).click();
  await expect(page.locator(".bubble.beacon").last()).toContainText("Rua dos Inválidos");
  await expect(page.locator(".bubbles .badge")).toHaveCount(0);
  await page.getByRole("button", { name: "Back" }).click();

  // SOS: a quick pick becomes a full message with the place, the family link and the police number.
  await page.locator("#sos").press("Enter"); // the button starts on a hold; from the keyboard one press is enough
  await page.getByRole("button", { name: "Being followed" }).click();
  await page.getByRole("button", { name: "Write the message" }).click();
  const draft = page.locator("#draft");
  await expect(draft).toHaveValue(/^Noa needs help: Being followed\.\nLocation: -22\.9095, -43\.1842 at \d{1,2}:\d\d [AP]M\nMap: https:\/\/maps\.google\.com\/\?q=-22\.90950,-43\.18421\nFollow live: http:\/\/127\.0\.0\.1:5005\/\?f=[0-9a-f]{32}\nCall Noa now\. If there is no answer, call 190 \(police\)\.$/);
  const link = (await draft.inputValue()).match(/Follow live: (\S+)/)[1];
  await expect(page.locator("#send")).toHaveAttribute("href", /^sms:\+972501234567\?&body=Noa%20needs%20help/);
  // Don't really hand over to the Mac's Messages app: Chrome would ask "Open Messages?" and wait for an answer.
  await page.locator("#send").evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
  await page.locator("#send").click();
  await expect(page.getByRole("heading", { name: "Press send so Mom knows" })).toBeVisible();
  await expect(page.locator("#sync")).toHaveText(/Family page updated/);

  // What reached the database is what shared/schema/README.md describes.
  const saved = await admin(async (db) => {
    const incidents = (await getDocs(collectionGroup(db, "incidents"))).docs;
    return { incidents: incidents.map((d) => d.data()), updates: (await getDocs(collection(incidents[0].ref, "updates"))).docs.map((d) => d.data()),
      shares: (await getDocs(collection(db, "shares"))).docs.map((d) => ({ id: d.id, ...d.data() })), trips: (await getDocs(collection(db, "trips"))).docs.map((d) => d.data()) };
  });
  expect(saved.incidents).toHaveLength(1);
  expect(saved.incidents[0]).toMatchObject({ platform: "web", phase: "SosActive", method: "SosButton", userConfirmed: true, travelerName: "Noa", description: "Being followed", situation: "followed", city: "Rio de Janeiro", country: "Brazil", emergency: { police: "190", ambulance: "192" } });
  expect(saved.incidents[0].message).toContain(`Follow live: ${link}`);
  expect(saved.updates).toHaveLength(1);
  expect(saved.updates[0]).toMatchObject({ kind: "alert", lat: -22.9095, lng: -43.18421, pointsHeld: 0 });
  expect(saved.shares).toHaveLength(1);
  expect(link.endsWith(saved.shares[0].id)).toBe(true);
  expect(saved.shares[0]).toMatchObject({ revoked: false, tripId: saved.incidents[0].tripId });
  expect(saved.trips[0]).toMatchObject({ platform: "web", travelerName: "Noa" });

  // Mom opens the link on her own device (another browser profile, another anonymous user).
  const mom = await (await browser.newContext()).newPage();
  await mom.goto(`${link}&emu`);
  await expect(mom.getByRole("heading", { name: /Noa's SOS/ })).toContainText("Active");
  await expect(mom.locator("#fam-message")).toContainText("Noa needs help: Being followed.");
  await expect(mom.locator("#fam-summary")).toContainText("1. Call Noa now.");
  await expect(mom.locator("#fam-summary .badge")).toHaveCount(0); // the fixed wording carries no AI badge
  await expect(mom.locator("a.tel").first()).toHaveAttribute("href", "tel:190");
  await expect(mom.locator(".fam-list li")).toHaveCount(1);
  await expect(mom.locator("#fam-last")).toContainText("Last seen");

  // She ends it; Mom's page changes by itself.
  await page.getByRole("button", { name: "I'm safe now, end SOS" }).click();
  await page.getByRole("button", { name: "Yes, end it" }).click();
  await expect(page.getByRole("heading", { name: "SOS ended" })).toBeVisible();
  await expect(mom.getByRole("heading", { name: /Noa's SOS/ })).toContainText("Ended");
  await expect(mom.locator(".fam-list li").first()).toContainText("Noa says the SOS is over");
  expect(errors).toEqual([]);
  await context.close();
});

test("family view at /f/{shareId}: live updates, then the link is turned off", async ({ page }) => {
  const now = Date.now(), incident = { ...demo.incident, phase: "SosActive", resolvedAtMillis: null, startedAtMillis: now - 300_000, alertSentAtMillis: now - 290_000, updatedAtMillis: now };
  delete incident.id;
  const at = (u, ago) => { const { id, ...rest } = u; return { ...rest, createdAtMillis: now - ago, takenAtMillis: now - ago - 4000 }; };
  await admin(async (db) => {
    await setDoc(doc(db, "trips/demo-trip"), { ownerUid: "demo", travelerName: "Noa", city: "Rio de Janeiro", country: "Brazil", packId: null, platform: "android", createdAtMillis: now });
    await setDoc(doc(db, `shares/${SHARE}`), { ...demo.share, createdAtMillis: now });
    await setDoc(doc(db, "trips/demo-trip/incidents/demo-incident"), incident);
    await setDoc(doc(db, "trips/demo-trip/incidents/demo-incident/updates/u00"), at(demo.updates[0], 290_000));
    await setDoc(doc(db, "trips/demo-trip/incidents/demo-incident/updates/u01"), at(demo.updates[1], 150_000));
  });
  await page.goto(`/f/${SHARE}?emu`);
  await expect(page.getByRole("heading", { name: /Noa's SOS/ })).toContainText("Active");
  await expect(page.locator(".fam-list li")).toHaveCount(2);
  await expect(page.locator("#fam-last")).toContainText("Last seen 2 min ago");
  await expect(page.locator("#fam-message")).toContainText("A man is following her near the bars");
  await expect(page.locator("a.tel")).toHaveCount(3);

  await admin((db) => setDoc(doc(db, "trips/demo-trip/incidents/demo-incident/updates/u02"), at({ ...demo.updates[2], pointsHeld: 4 }, 5_000)));
  await expect(page.locator(".fam-list li")).toHaveCount(3);
  await expect(page.locator(".fam-list li").first()).toContainText("4 location points were recorded while the phone had no signal.");
  await expect(page.locator("#fam-last")).toContainText("Last seen just now");

  await admin((db) => updateDoc(doc(db, `shares/${SHARE}`), { revoked: true }));
  await expect(page.getByRole("heading", { name: "This link has been turned off" })).toBeVisible();
});

test("family view: a link nothing has been saved under yet, and a broken link", async ({ page }) => {
  await page.goto("/f/ffffffffffffffffffffffffffffffff?emu");
  await expect(page.getByRole("heading", { name: "Nothing from the phone yet" })).toBeVisible();
  await page.goto("/?emu&f=not-a-link");
  await expect(page.getByRole("heading", { name: "This link doesn't look right" })).toBeVisible();
});

test("/demo replays the made-up incident with no database", async ({ page }) => {
  await page.goto("/demo?emu");
  await expect(page.locator(".fam-demo")).toContainText("made-up incident");
  await expect(page.getByRole("heading", { name: /Noa's SOS/ })).toContainText("Active");
  await expect(page.locator("#fam-summary")).toContainText("What to do:");
  await expect(page.locator(".fam-list li")).toHaveCount(2, { timeout: 25_000 }); // the alert, then the first update
  expect(await admin(async (db) => (await getDocs(collectionGroup(db, "incidents"))).size)).toBe(0);
});

test("after one visit the traveler's app opens with no connection", async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  await page.goto("/?emu&reset");
  await expect(page.getByRole("button", { name: "See the same night with Beacon" })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready); // the files are saved on this device now
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("button", { name: "See the same night with Beacon" })).toBeVisible();
  await page.goto("/demo?emu"); // a page address falls back to the saved app, which reads the saved fixture
  await expect(page.locator(".fam-demo")).toContainText("made-up incident");
  await expect(page.getByRole("heading", { name: /Noa's SOS/ })).toBeVisible();
  await context.close();
});
