// The one place Beacon web talks to AI: Firebase AI Logic in hybrid mode.
// Hybrid = Chrome's built-in model (Gemini Nano) answers on this computer when it can, so it works
// offline; otherwise the question goes to Gemini in the cloud.
// It only switches on when firebase-config.js exists (see firebase-config.example.js).
// Every caller has a no-AI fallback, so the app still works without it.

const FIREBASE = "https://www.gstatic.com/firebasejs/12.4.0"; // check the current version when wiring this up
const CLOUD_MODEL = "gemini-3.5-flash-lite";                  // same cloud model as the Android app

let modelPromise = null, searchPromise = null, appPromise = null;

// The one Firebase app for this page (both models share it), or null without firebase-config.js.
function firebaseApp() {
  appPromise ??= (async () => {
    const { firebaseConfig } = await import("../firebase-config.js");
    if (!firebaseConfig?.apiKey) return null;
    const { initializeApp } = await import(`${FIREBASE}/firebase-app.js`);
    const app = initializeApp(firebaseConfig);
    // App Check proves requests come from this site, so nobody else can spend the project's Gemini allowance.
    // The project enforces it for AI Logic: without a reCAPTCHA site key the AI answers nothing.
    if (firebaseConfig.recaptchaSiteKey) {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import(`${FIREBASE}/firebase-app-check.js`);
      initializeAppCheck(app, { provider: new ReCaptchaV3Provider(firebaseConfig.recaptchaSiteKey), isTokenAutoRefreshEnabled: true });
    }
    return app;
  })().catch(() => null);
  return appPromise;
}

// Gemini in the cloud with Google Search turned on, for researching a city's scams while online.
async function loadSearchModel() {
  try {
    const app = await firebaseApp();
    if (!app) return null;
    const { getAI, getGenerativeModel, GoogleAIBackend } = await import(`${FIREBASE}/firebase-ai.js`);
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    return getGenerativeModel(ai, { model: CLOUD_MODEL, tools: [{ googleSearch: {} }] });
  } catch {
    return null;
  }
}

async function loadModel() {
  try {
    const app = await firebaseApp();
    if (!app) return null;
    const { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } = await import(`${FIREBASE}/firebase-ai.js`);
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    return getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE, inCloudParams: { model: CLOUD_MODEL } });
  } catch {
    return null; // no config file, blocked network, or an old browser
  }
}

// True when AI is set up on this page.
export async function aiReady() {
  modelPromise ??= loadModel();
  return (await modelPromise) !== null;
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

// Returns the model's text, or null when AI isn't available (the caller then uses its fallback).
export async function askAi(prompt) {
  modelPromise ??= loadModel();
  const model = await modelPromise;
  if (!model) return null;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim() || null;
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
