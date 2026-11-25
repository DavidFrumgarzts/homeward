# firebase

Beacon's backend: the database rules, and the tests that prove them. The data layout (paths, fields, how a family link grants access) is described in `shared/schema/README.md`.

- `firestore.rules`: who may read and write what. In short: a traveler owns her trip, incidents, updates, packs and family links; a contact who opens a family link may read that one trip's incidents and updates and nothing else, and loses that when the link is turned off; nobody can list family links.
- `firestore.indexes.json`: no extra indexes are needed yet.
- `tests/rules.test.js`: 18 tests against the Firestore emulator.
- `package.json`: test tools only.

`firebase.json` and `.firebaserc` are in the **repo root**, not here: the Firebase CLI refuses to deploy a hosting folder (`web/`) that is outside the folder holding `firebase.json`.

## Test the rules

```
cd firebase
npm install        # once
npm test           # starts the Firestore emulator and runs the tests
```

The emulator needs Java: `export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` on this Mac. Emulator logs land in this folder and are git-ignored.

## Deploy

From the repo root, after `npm test` passes here and in `web/`:

```
firebase deploy --only hosting,firestore --project homeward-6999c
```

- Hosting uploads `web/` as it is, minus the list under `hosting.ignore` in `firebase.json`: the local config (`firebase-config.js`), tests, `node_modules`, `package*.json`, `serve.py` and the README. That leaves the page, `styles.css`, `sw.js`, `js/` and `fixtures/` (25 files). `appcheck-config.js` is uploaded when it exists: it holds only the public reCAPTCHA site key.
- Every address is served `index.html` (`/f/{shareId}`, `/demo`), and the app's files are sent with `Cache-Control: no-cache` so a new deploy shows up at once.
- After the first deploy, open `https://homeward-6999c.web.app/__/firebase/init.json` and check it contains an `appId`. The page takes its Firebase config from there. If `appId` is missing, link the web app to the Hosting site in the console (Project settings > Your apps > the web app > Link to a Firebase Hosting site).

## Console steps only a person can do

- App Check > Apps > the web app: register reCAPTCHA Enterprise for the hosted domain and put the site key in `web/appcheck-config.js` (see `web/appcheck-config.example.js`). Until then the hosted site has no AI.
- App Check > Apps > the web app's menu > Manage debug tokens: add the token each developer's browser prints on localhost (see `web/README.md`).
- App Check is enforced for Firebase AI Logic. It is not enforced for Firestore today; if that is turned on, the family view and the web SOS need a valid App Check token too.
