// Reads hotel booking emails from Gmail, in this browser, with Google Identity Services (scope gmail.readonly).
// Only booking emails from the last 6 months, at most 5. The access token stays in memory and is revoked after.
// Nothing goes to Beacon's servers; the email text goes to the AI (Firebase AI Logic) to find the hotel.
// Testing mode: Google only lets the test users listed in the Cloud console sign in until the app is verified.
import { gmailQuery, plainText } from "../../js/booking.js";

let clientId = null;
export async function gmailAvailable() {
  if (clientId !== null) return !!clientId;
  try { clientId = (await import("../../google-config.js")).gmailClientId || ""; } catch { clientId = ""; }
  return !!clientId;
}

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((ok, fail) => {
    const s = Object.assign(document.createElement("script"), { src: "https://accounts.google.com/gsi/client", async: true, onload: ok, onerror: () => fail(new Error("load")) });
    document.head.append(s);
  });
}

const decode = (data) => { const b = atob(data.replace(/-/g, "+").replace(/_/g, "/")); return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0))); };
function bodyOf(part) {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) return decode(part.body.data);
  if (part.parts) { const plain = part.parts.map(bodyOf).find(Boolean); if (plain) return plain; }
  if (part.mimeType === "text/html" && part.body?.data) return plainText(decode(part.body.data));
  return "";
}

// Must be called from a tap (the Google window is a popup). Returns [emailText, ...] or {error: "denied"|"none"|"failed"}.
export async function readGmailBookings() {
  if (!(await gmailAvailable())) return { error: "failed" };
  try { await loadGis(); } catch { return { error: "failed" }; }
  const token = await new Promise((resolve) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: "https://www.googleapis.com/auth/gmail.readonly",
      callback: (r) => resolve(r.access_token || null), error_callback: () => resolve(null),
    });
    client.requestAccessToken({ prompt: "consent" });
  });
  if (!token) return { error: "denied" };
  const get = (path) => fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : null));
  try {
    const list = await get(`messages?maxResults=5&q=${encodeURIComponent(gmailQuery)}`);
    if (!list?.messages?.length) return { error: "none" };
    const mails = await Promise.all(list.messages.map((m) => get(`messages/${m.id}?format=full`)));
    return mails.filter(Boolean).map((m) => {
      const h = (n) => m.payload?.headers?.find((x) => x.name.toLowerCase() === n)?.value || "";
      return `Subject: ${h("subject")}\nFrom: ${h("from")}\n\n${bodyOf(m.payload).slice(0, 6000)}`;
    });
  } catch { return { error: "failed" }; }
  finally { google.accounts.oauth2.revoke(token, () => {}); }
}
