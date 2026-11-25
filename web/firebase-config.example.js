// Copy this file to firebase-config.js and paste the web app config from the Firebase console
// (Project settings > Your apps > Web app). firebase-config.js is git-ignored.
// Without it, Beacon web still runs: answers come straight from the saved pack, with no AI.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: "",
  recaptchaSiteKey: "", // App Check (reCAPTCHA v3) site key: public, made for this site's domain
};
