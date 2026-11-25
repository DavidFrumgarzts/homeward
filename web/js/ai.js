// The one place Beacon web talks to AI: Firebase AI Logic in hybrid mode (PREFER_ON_DEVICE).
// Hybrid = Chrome's built-in model (Gemini Nano) answers on this computer when it can, so it works
// offline and the text never leaves the machine; otherwise the question goes to Gemini in the cloud.
// Every answer says where it ran, and the screens show that as a small badge.
// AI only switches on when Firebase is set up and App Check is on (js/firebase.js). Every caller has a
// no-AI fallback, so the app still works without it.
import { firebase, signedIn, SDK } from "./firebase.js";

const CLOUD_MODEL = "gemini-3.5-flash-lite"; // same cloud model as the Android app
// The cloud goes through the Agent Platform (Vertex AI) Gemini API, billed to the Google Cloud account.
// The Gemini Developer API stopped answering once the project moved to the Blaze plan (it wants
// prepaid AI Studio credit). "global" is the only location that has this model.
const LOCATION = "global";

let modelPromise = null, searchPromise = null;

async function loadModel() {
  try {
    const fb = await firebase();
    if (!fb?.appCheck || !fb.config.appId) return null; // AI Logic refuses calls without App Check
    await signedIn(); // anonymous sign-in first, so calls belong to a user
    const { getAI, getGenerativeModel, AgentPlatformBackend, InferenceMode } = await import(`${SDK}/firebase-ai.js`);
    const ai = getAI(fb.app, { backend: new AgentPlatformBackend(LOCATION) });
    return getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE, inCloudParams: { model: CLOUD_MODEL } });
  } catch {
    return null; // no config, blocked network, or an old browser
  }
}

// True when AI is set up on this page.
export async function aiReady() {
  modelPromise ??= loadModel();
  return (await modelPromise) !== null;
}

// Returns { text, source } or null when AI isn't available or the call failed (the caller then uses
// its fallback). source is "on_device" or "in_cloud": where this answer really ran.
export async function askAi(prompt) {
  modelPromise ??= loadModel();
  const model = await modelPromise;
  if (!model) return null;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text ? { text, source: String(result.response.inferenceSource || "").toLowerCase() || null } : null;
  } catch {
    return null;
  }
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
  modelPromise ??= loadModel();
  const model = await modelPromise;
  if (!model?.initializeDeviceModel) return;
  try { await model.initializeDeviceModel((loaded) => onProgress(Math.max(0, Math.min(1, loaded)))); onProgress(1); }
  catch { /* no built-in model in this browser: the cloud answers */ }
}

// Reads a photo (scan check). Returns the model's text, or "" when AI isn't available or fails.
export async function askAiAboutImage(prompt, file) {
  modelPromise ??= loadModel();
  const model = await modelPromise;
  if (!model) return "";
  try {
    const data = await new Promise((ok, fail) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = fail; r.readAsDataURL(file); });
    const result = await model.generateContent([prompt, { inlineData: { data, mimeType: file.type || "image/jpeg" } }]);
    return result.response.text().trim();
  } catch {
    return "";
  }
}

// Gemini in the cloud with Google Search, for looking up a city's reported scams while online.
async function loadSearchModel() {
  try {
    const fb = await firebase();
    if (!fb?.appCheck || !fb.config.appId) return null;
    await signedIn();
    const { getAI, getGenerativeModel, AgentPlatformBackend } = await import(`${SDK}/firebase-ai.js`);
    return getGenerativeModel(getAI(fb.app, { backend: new AgentPlatformBackend(LOCATION) }), { model: CLOUD_MODEL, tools: [{ googleSearch: {} }] });
  } catch {
    return null;
  }
}

// Asks Gemini with Google Search (needs a connection). Returns the text, or null when AI isn't set up or it fails.
export async function askAiWithSearch(prompt) {
  searchPromise ??= loadSearchModel();
  const model = await searchPromise;
  if (!model || !navigator.onLine) return null;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim() || null;
  } catch {
    return null;
  }
}
