// The family view's "What's happening and what should I do?" panel.
// HYBRID AI (PREFER_ON_DEVICE): Chrome's built-in model writes it on the contact's own computer when it
// can, so her location trail is summarised without leaving that machine; the cloud is the fallback.
// The model is given ONLY the facts below (from the incident and its updates) and its answer is
// checked before it is shown. If there is no AI, or the answer fails the check, a fixed template is
// used. Neither ever says a crime is happening: Beacon only knows what the phone reported.
// The pure parts (facts, template, check) are tested in tests/summary.test.js.
import { askAi } from "./ai.js";
import { clockText, latestFix, travelerName } from "./timeline.js";

function facts(incident, updates) {
  const name = travelerName(incident), e = incident.emergency || {}, fix = latestFix(updates);
  const ended = incident.phase === "Resolved";
  return [
    incident.userConfirmed === false
      ? `${name} did not answer a safety check from the Beacon app at ${clockText(incident.startedAtMillis)}. Beacon raised the alert by itself and does not know what is happening.`
      : `${name} sent an SOS from the Beacon app at ${clockText(incident.startedAtMillis)}.`,
    `Place: ${incident.city}, ${incident.country}.`,
    incident.description ? `${name} wrote: "${incident.description}".` : `${name} did not write what is happening.`,
    incident.triggerReasons?.length ? `Why Beacon asked: ${incident.triggerReasons.join("; ")}.` : null,
    fix ? `Last known location: recorded at ${clockText(fix.atMillis)}. It is on the map on this page.` : "No location has arrived yet.",
    fix?.batteryPercent != null ? `Phone battery: ${fix.batteryPercent}%.` : null,
    ended ? `${name} ended the SOS at ${clockText(incident.resolvedAtMillis ?? incident.updatedAtMillis)} and says it is over.` : "The SOS is still active.",
    e.police ? `Police in ${incident.city}: ${e.police}.` : null,
    e.ambulance ? `Ambulance: ${e.ambulance}.` : null,
    e.embassyPhone ? `${e.embassyName}: ${e.embassyPhone}.` : null,
  ].filter(Boolean);
}

// The fixed, reviewed wording used when AI is unavailable or its answer is not safe to show.
export function summaryTemplate(incident, updates) {
  const name = travelerName(incident), e = incident.emergency || {}, f = facts(incident, updates);
  const known = [f[0], f[2], f.find((line) => line.startsWith("Last known") || line.startsWith("No location"))].join(" ");
  if (incident.phase === "Resolved") {
    return `${known} ${f.find((line) => line.includes("ended the SOS"))}\nWhat to do:\n1. Call or message ${name} to check in.\n2. If something still seems wrong, call the police in ${incident.city}${e.police ? ` on ${e.police}` : ""}.`;
  }
  const help = [e.police ? `the police in ${incident.city} on ${e.police}` : null, e.embassyPhone ? `${e.embassyName} on ${e.embassyPhone}` : null].filter(Boolean).join(", or ");
  return `${known}\nWhat to do:\n1. Call ${name} now.\n2. If there is no answer, call ${help || "the local police"} and give them the location on the map.\n3. Keep this page open. It updates by itself.`;
}

export function summaryPrompt(incident, updates) {
  return `You are helping a family member read a safety alert from the app Beacon. Use ONLY the facts below.
Write 2 short sentences saying what is known. Then write "What to do:" and up to 3 short numbered steps.
Do not guess what is happening. Do not say that a crime happened and do not name a crime.
Do not add places, times or numbers that are not in the facts. Copy names, times and phone numbers exactly.
Plain words, no headings, under 90 words.

FACTS
${facts(incident, updates).map((line) => `- ${line}`).join("\n")}`;
}

const CRIME_WORDS = /\b(kidnap\w*|abduct\w*|assault\w*|attack\w*|rap(e|ed|ist)|robb\w*|mugg\w*|murder\w*|kill\w*|stabb\w*|shot|shoot\w*|crime\w*|criminal\w*|traffick\w*|hostage\w*)\b/gi;

// Is an AI answer safe to show? No if it is empty or rambling, if it uses a crime word she did not
// write herself, or if it contains a number (a phone number, a time) that is not in the facts.
export function safeToShow(text, incident, updates) {
  if (!text || text.length < 30 || text.length > 900) return false;
  const hers = (incident.description || "").toLowerCase();
  if ((text.match(CRIME_WORDS) || []).some((word) => !hers.includes(word.toLowerCase()))) return false;
  const known = facts(incident, updates).join("\n").replace(/[\s-]/g, "");
  return (text.match(/\+?\d[\d\s-]{1,}\d/g) || []).every((number) => known.includes(number.replace(/[\s-]/g, "")));
}

// { text, source }: source is "on_device" or "in_cloud" when AI wrote it, null for the template.
export async function writeSummary(incident, updates) {
  const ai = await askAi(summaryPrompt(incident, updates), { private: true });
  return ai && safeToShow(ai.text, incident, updates) ? ai : { text: summaryTemplate(incident, updates), source: null };
}
