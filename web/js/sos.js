// SOS: turns a few words into a clear message and hands it to the phone's messages app.
// A web page can't send a text by itself, so Beacon opens your messages app with the people and
// the message filled in; you press send. (The Android app sends it for you.)
// HYBRID AI: the model only rewrites her words into one or two clear sentences. Everything else in the
// message (coordinates, map link, family link, the police number) is added by code in js/messages.js.
import { askAi } from "./ai.js";
import { pack } from "./pack.js";
import { alertText, ended, plainSentence } from "./messages.js";
import { clockText } from "./timeline.js";
import { sosSentencePrompt } from "./prompts.js";

// realFix: your real GPS position ({ lat, lng, takenAtMillis, accuracy }) or null. We never put the demo
// map's position in an SOS, because family would be sent to the wrong place.
// familyLink: the page family can follow (js/incident.js), or null.
// Returns { text, source }: source is "on_device" or "in_cloud" when AI rewrote her words, null for the plain sentence.
export async function writeSos(name, note, realFix, familyLink = null) {
  const profile = { name, pronoun: "UseName" };
  const ai = await askAi(sosSentencePrompt(profile, note));
  const usable = ai && ai.text.length <= 400; // a rambling answer is not a rewrite: use her own words
  const fix = realFix ? { point: { lat: realFix.lat, lng: realFix.lng } } : null;
  const time = realFix?.takenAtMillis ? clockText(realFix.takenAtMillis) : null;
  return { text: alertText(profile, usable ? ai.text : plainSentence(profile, note), fix, time, pack.police, familyLink), source: usable ? ai.source : null };
}

// The text that tells contacts the SOS is over.
export const endedText = (name) => ended({ name, pronoun: "UseName" }, clockText(Date.now()));

export function checkInText(name, realSpot) {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const map = realSpot ? `\nWhere: https://maps.google.com/?q=${realSpot.lat.toFixed(5)},${realSpot.lng.toFixed(5)}` : "";
  return `${name || "I"} ${name ? "is" : "am"} OK · ${time}${map}`;
}

// A link that opens the messages app with these numbers and this text.
export function smsLink(phones, text) {
  return `sms:${phones.join(",")}?&body=${encodeURIComponent(text)}`;
}
