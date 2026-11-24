// SOS: turns a few words into a clear message and hands it to the phone's messages app.
// A web page can't send a text by itself, so Beacon opens your messages app with the people and
// the message filled in; you press send. (The Android app sends it for you.)
import { askAi } from "./ai.js";
import { pack } from "./pack.js";

// realSpot: your real GPS position ({lat, lng}) or null. We never put the demo map's position
// in an SOS, because family would be sent to the wrong place.
export async function writeSos(name, note, realSpot) {
  const who = name || "Your contact";
  const map = realSpot ? `\nMap: https://maps.google.com/?q=${realSpot.lat.toFixed(5)},${realSpot.lng.toFixed(5)}` : "";
  const ai = await askAi(`Rewrite this emergency note into a clear SOS text message for family. Max 50 words.
Write in third person about ${who}. Keep every fact from the note. Do NOT add any new facts.
End with: "Call ${who} now. If there is no answer, call ${pack.police} (police)."
Note from ${who}: "${note}"`);
  const text = ai ?? `${who} needs help: ${note}. Call ${who} now. If there is no answer, call ${pack.police} (police).`;
  return text + map;
}

export function checkInText(name, realSpot) {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const map = realSpot ? `\nWhere: https://maps.google.com/?q=${realSpot.lat.toFixed(5)},${realSpot.lng.toFixed(5)}` : "";
  return `${name || "I"} ${name ? "is" : "am"} OK · ${time}${map}`;
}

// A link that opens the messages app with these numbers and this text.
export function smsLink(phones, text) {
  return `sms:${phones.join(",")}?&body=${encodeURIComponent(text)}`;
}
