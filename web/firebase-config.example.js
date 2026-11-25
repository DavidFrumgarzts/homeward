// Copy this file to firebase-config.js and paste the web app config from the Firebase console
// (Project settings > Your apps > Web app). firebase-config.js is git-ignored and is NOT uploaded
// with the site: on Firebase Hosting the page gets its config from Hosting itself.
// Without it, Beacon web still runs on localhost: answers come straight from the saved pack, with no
// AI, and no family page is created.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: "",
  // Optional, localhost only. App Check prints a new debug token in each browser's console. To use
  // one token everywhere instead, register it in the Firebase console and paste it here.
  // appCheckDebugToken: "",
};
