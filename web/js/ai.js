// The one place Beacon web talks to AI. Free, two ways:
//   1. Chrome's built-in model (Gemini Nano) on this computer, through Firebase AI Logic (ONLY_ON_DEVICE): works
//      offline and the text never leaves the machine. Tried first.
//   2. Otherwise the askGemini function (backend/functions/index.js): Gemini's free tier, with the key kept on the
//      server. The free tier may use prompts to improve Google's products, so private questions ({private: true}:
//      booking emails, check-in answers) never go there; they use the device or the caller's plain fallback.
// Google's paid route (Vertex AI) refuses this project while its billing account is a free trial, and David
// doesn't want to pay, so it isn't used. There's no free web search either: askAiWithSearch answers null and
// the callers use what the model knows (scams) or the researchAreas function (areas to avoid).
// Every answer says where it ran ("on_device" / "in_cloud"); the screens show that as a small badge.
import { firebase, signedIn, SDK } from "./firebase.js";

let devicePromise = null, cloudPromise = null;

async function loadDevice() {
  try {
    const fb = await firebase();
    if (!fb?.config.appId) return null;
    const { getAI, getGenerativeModel, InferenceMode, AgentPlatformBackend } = await import(`${SDK}/firebase-ai.js`);
    return getGenerativeModel(getAI(fb.app, { backend: new AgentPlatformBackend("global") }), { mode: InferenceMode.ONLY_ON_DEVICE });
  } catch { return null; }
}
async function loadCloud() {
  try {
    const fb = await firebase();
    if (!fb?.appCheck || !(await signedIn())) return null; // the function refuses calls without App Check
    const { getFunctions, httpsCallable } = await import(`${SDK}/firebase-functions.js`);
    return httpsCallable(getFunctions(fb.app, "us-central1"), "askGemini", { timeout: 60000 });
  } catch { return null; }
}
const device = () => (devicePromise ??= loadDevice());
const cloud = () => (cloudPromise ??= loadCloud());
async function onDevice(parts) {
  const m = await device();
  if (!m) return "";
  try { return (await m.generateContent(parts)).response.text().trim(); } catch { return ""; }
}
async function inCloud(prompt, image) {
  const call = await cloud();
  if (!call || !navigator.onLine) return "";
  try { return String((await call(image ? { prompt, image } : { prompt })).data?.text || "").trim(); } catch { return ""; }
}

// True when AI is set up on this page.
export async function aiReady() {
  return !!(await device()) || !!(await cloud());
}

// Returns { text, source } or null when AI isn't available or the call failed (the caller then uses
// its fallback). source is "on_device" or "in_cloud": where this answer really ran.
// {private: true}: this computer only (booking emails, check-in answers).
export async function askAi(prompt, { private: priv = false } = {}) {
  const local = await onDevice(prompt);
  if (local) return { text: local, source: "on_device" };
  if (priv) return null;
  const text = await inCloud(prompt);
  return text ? { text, source: "in_cloud" } : null;
}

// The words on the badge. "" = no badge (plain rules answered, or the SDK didn't say).
export function sourceLabel(source) {
  return source === "on_device" ? "On this computer" : source === "in_cloud" ? "Cloud" : "";
}

// Chrome only creates (and, the first time, downloads) its built-in model after a click or key press.
// app.js calls this from the first click on the page. onProgress gets 0..1 while the model downloads;
// nothing waits for it: until the model is ready, answers come from the cloud.
let warmed = false;
export async function warmUp(onProgress = () => {}) {
  if (warmed) return;
  warmed = true;
  const model = await device();
  if (!model?.initializeDeviceModel) return;
  try { await model.initializeDeviceModel((loaded) => onProgress(Math.max(0, Math.min(1, loaded)))); onProgress(1); }
  catch { /* no built-in model in this browser: the free cloud answers */ }
}

// Reads a photo (scan check). Returns the model's text, or "" when AI isn't available or fails.
export async function askAiAboutImage(prompt, file) {
  try {
    const data = await new Promise((ok, fail) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = fail; r.readAsDataURL(file); });
    const mimeType = file.type || "image/jpeg";
    return (await onDevice([prompt, { inlineData: { data, mimeType } }])) || (await inCloud(prompt, { data, mimeType }));
  } catch {
    return "";
  }
}

// Web search with the AI isn't free (Google Search grounding needs a paid plan), so these answer null and the
// callers fall back: scams from what the model knows (marked "not checked"), areas from the researchAreas function.
export async function askAiWithSearch() { return null; }
