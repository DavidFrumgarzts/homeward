// Takes the web screenshots in docs/walkthrough/img/ (web-*.png) from the pages running on the
// Firebase emulators, in the Chrome installed on this computer.
//   1. from the repo root:  firebase emulators:start --only auth,firestore,hosting --project demo-beacon
//   2. from web/:           node tests/seed-emulator.js && node tests/screenshots.js
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:5005", OUT = new URL("../../docs/walkthrough/img/", import.meta.url).pathname;
const SHARE = "0123456789abcdef0123456789abcdef";
const browser = await chromium.launch({ channel: "chrome" });
const shot = (page, name) => page.screenshot({ path: `${OUT}web-${name}.png` });
const settle = (page, ms = 2500) => page.waitForTimeout(ms); // fonts and map tiles

// The traveler's app, phone-sized, with a GPS position inside Lapa.
const phone = await browser.newContext({ viewport: { width: 430, height: 880 }, deviceScaleFactor: 2, serviceWorkers: "block", permissions: ["geolocation"], geolocation: { latitude: -22.9095, longitude: -43.18421 } });
const t = await phone.newPage();
await t.goto(`${BASE}/?emu&reset`);
await t.getByRole("button", { name: "See the same night with Beacon" }).click();
await settle(t, 3200); await shot(t, "1-story");
await t.getByRole("button", { name: "Start with Beacon" }).click();
await t.getByRole("button", { name: "Set up in 1 minute" }).click();
await t.locator("#me").fill("Noa"); await t.locator("#name").fill("Mom"); await t.locator("#phone").fill("+972501234567");
await t.getByRole("button", { name: "+ Add person" }).click();
await t.getByRole("button", { name: "Continue" }).click();
await t.getByRole("button", { name: "Start exploring" }).click();
await settle(t, 1200); await shot(t, "2-home");
await t.getByRole("button", { name: "Is this area OK now?" }).click();
await settle(t, 2200); await shot(t, "3-ask-beacon");
await t.getByRole("button", { name: "Back" }).click();
await t.locator("#sos").press("Enter");
await t.getByRole("button", { name: "Being followed" }).click();
await t.getByRole("button", { name: "Write the message" }).click();
await t.locator("#draft").waitFor(); await shot(t, "4-sos-message");
await t.locator("#send").evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
await t.locator("#send").click();
await t.getByText("Family page updated").waitFor(); await shot(t, "5-sos-sent");

// The family view: a seeded incident on a laptop and on a phone, then the demo.
const laptop = await browser.newContext({ viewport: { width: 1180, height: 860 }, deviceScaleFactor: 2, serviceWorkers: "block" });
const f = await laptop.newPage();
await f.goto(`${BASE}/f/${SHARE}?emu`);
await f.getByRole("heading", { name: /SOS/ }).waitFor(); await settle(f, 5000); await shot(f, "6-family-view");
await f.screenshot({ path: `${OUT}web-7-family-view-full.png`, fullPage: true });
const m = await phone.newPage();
await m.goto(`${BASE}/f/${SHARE}?emu`);
await m.getByRole("heading", { name: /SOS/ }).waitFor(); await settle(m, 5000);
await m.screenshot({ path: `${OUT}web-8-family-view-phone.png`, fullPage: true });
await f.goto(`${BASE}/demo?emu`);
await f.locator(".fam-list li").nth(2).waitFor({ timeout: 40_000 }); await settle(f, 3000); await shot(f, "9-demo");
await browser.close();
console.log(`Saved web-*.png in ${OUT}`);
