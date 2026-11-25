// Browser smoke tests (tests/e2e/). `npm run test:e2e` starts the Firebase emulators (Auth, Firestore
// and Hosting, which serves this folder at 127.0.0.1:5005 with the same rewrites as the real site)
// and then runs these in the Chrome that is installed on this computer.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 }, // generous: the page loads the Firebase SDK from the network first
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5005", channel: "chrome", serviceWorkers: "block", viewport: { width: 1180, height: 900 } },
});
