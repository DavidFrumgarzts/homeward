// "Ask Beacon": answers a question from the saved pack.
// With AI (js/ai.js) the model rewrites the saved facts into an answer and keeps the last two
// exchanges in mind for follow-ups. Without AI, a few plain rules pick the right fact.
// Either way, numbers and names are copied from the pack, never made up.
import { askAi } from "./ai.js";
import { pack, clock, nearestPlace, zoneCloseness, zoneRiskyAt, METERS_PER_STEP } from "./pack.js";
import { recommends } from "./scams.js";

function facts(you, hour) {
  const z = pack.zone;
  const zoneMeters = Math.max(0, Math.round((Math.hypot(you.x - z.cx, you.y - z.cy) - z.rx) * METERS_PER_STEP));
  const places = pack.places.map((p) => `- ${p.name} (${p.kind}), ${Math.round(Math.hypot(p.x - you.x, p.y - you.y) * METERS_PER_STEP)} m away, open 24 hours`).join("\n");
  return `Police: ${pack.police}. Ambulance: ${pack.ambulance}. Embassy: ${pack.embassy.name}, ${pack.embassy.phone}.
Street to avoid: ${z.name}, about ${zoneMeters} m from you. Avoid from ${clock(z.fromHour)} to ${clock(z.toHour)} (${zoneRiskyAt(hour) ? "risky right now" : "fine at this hour"}). ${z.reason}.
Busier, safer street: ${z.saferStreet}.
Closest open safe places:
${places}
Local phrases:
${pack.phrases.map(([en, pt]) => `- ${en} = ${pt}`).join("\n")}`;
}

function prompt(question, earlier, you, hour) {
  const chat = earlier.slice(-2).map(([q, a]) => `Traveler: ${q}\nBeacon: ${a}`).join("\n") || "(nothing yet)";
  return `You are Beacon, a calm safety helper for a traveler in ${pack.city}, Brazil. It is ${clock(hour)}.
Answer the question using ONLY the facts below. Copy phone numbers and names exactly.
If the facts don't cover it, say "I don't have that saved. Police: ${pack.police}."
Write at most 3 short steps, plain words, no headings.${recommends(question) ? `\nRecommend ${nearestPlace(you).name} first.` : ""}

FACTS
${facts(you, hour)}

EARLIER IN THIS CHAT
${chat}

QUESTION: ${question}`;
}

// No-AI answers: look for a few key words and reply with the matching saved fact.
function plainAnswer(question, you, hour) {
  const q = question.toLowerCase();
  const z = pack.zone, place = nearestPlace(you);
  if (/ambulance|hospital|hurt|doctor/.test(q)) return `Ambulance: ${pack.ambulance}. The nearest hospital is ${pack.places[1].name}, open 24 hours.`;
  if (/embassy|consulate|passport/.test(q)) return `${pack.embassy.name}: ${pack.embassy.phone}.`;
  if (/police|number|emergency/.test(q)) return `Police: ${pack.police}. Ambulance: ${pack.ambulance}.`;
  if (/safe place|where|go|open|far/.test(q)) return `${place.name} is ${place.meters} m away and open 24 hours. Stay on ${z.saferStreet} to get there.`;
  if (/ok|area|safe|zone|danger|risky/.test(q)) {
    const close = zoneCloseness(you);
    const where = close === "inside" ? `You are on ${z.name}.` : close === "near" ? `${z.name} is close to you.` : `You are away from ${z.name}.`;
    return `${where} Avoid it from ${clock(z.fromHour)} to ${clock(z.toHour)}${zoneRiskyAt(hour) ? ", which is now" : "; it's fine at this hour"}. ${z.saferStreet} stays busy.`;
  }
  if (/say|phrase|portuguese|help/.test(q)) return pack.phrases.map(([en, pt]) => `${en} = ${pt}`).join("\n");
  return `I don't have that saved. Police: ${pack.police}.`;
}

export async function answer(question, earlier, you) {
  const hour = new Date().getHours();
  return (await askAi(prompt(question, earlier, you, hour))) ?? plainAnswer(question, you, hour);
}
