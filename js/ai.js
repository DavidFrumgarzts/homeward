// The one place Beacon web talks to AI: Firebase AI Logic in hybrid mode.
// Hybrid = Chrome's built-in model (Gemini Nano) answers on this computer when it can, so it works
// offline; otherwise the question goes to Gemini in the cloud.
// It only switches on when firebase-config.js exists (see firebase-config.example.js).
// Every caller has a no-AI fallback, so the app still works without it.

const FIREBASE = "https://www.gstatic.com/firebasejs/12.4.0"; // check the current version when wiring this up
const CLOUD_MODEL = "gemini-3.5-flash-lite";                  // same cloud model as the Android app

let modelPromise = null;

async function loadModel() {
  try {
    const { firebaseConfig } = await import("../firebase-config.js");
    if (!firebaseConfig?.apiKey) return null;
    const { initializeApp } = await import(`${FIREBASE}/firebase-app.js`);
    const { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } = await import(`${FIREBASE}/firebase-ai.js`);
    const ai = getAI(initializeApp(firebaseConfig), { backend: new GoogleAIBackend() });
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
