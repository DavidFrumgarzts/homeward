// App Check for the HOSTED site (not needed on localhost, which uses a debug token).
// 1. In the Firebase console: App Check > Apps > the web app > reCAPTCHA Enterprise, and create a site
//    key for the hosting domain (homeward-6999c.web.app).
// 2. Copy this file to appcheck-config.js and paste the SITE key below. A site key is the public half:
//    it is meant to be in the page. The secret half stays in Google Cloud. appcheck-config.js is
//    git-ignored and is uploaded with the site.
// Without it the hosted site still works, with no AI: answers come from the plain rules.
export const recaptchaSiteKey = "";
