// Scams for the city you're in, and the photo check that matches a photo to one of them.
// The AI only picks WHICH saved scam a photo shows (or "none"); the verdict is that scam's saved level.
// A price is never needed: scammers rarely say it until it's too late.
// Research: when you're online in a city, Beacon asks Gemini (with Google Search) once a day for scams
// travelers report there, and saves them on the phone so the check works with no signal.
import { LABEL, TIP, KINDS } from "./scams.js";

const DAY = 24 * 3600_000, HOUR = 3600_000;
const LEVELS = { avoid: "Avoid", careful: "Careful" };

const jsonIn = (text, open, close) => {
  const t = String(text || ""), a = t.indexOf(open), b = t.lastIndexOf(close);
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
};
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const str = (x, max = 400) => (typeof x === "string" ? x.trim().slice(0, max) : "");

export function matchPrompt(city, scams) {
  const list = scams.map((x) => `${x.id}: ${x.title} — looks like: ${(x.looksLike || x.signs || []).join("; ")}`).join("\n");
  return `A traveler in ${city} took this photo and wants to know if it's a scam. Compare it ONLY with this list of scams reported in ${city}:
${list}
Pick the one item the photo clearly shows, or "none" if it shows none of them. Don't guess from a weak resemblance.
Return ONLY JSON: {"match":"<id or none>","seen":"what is in the photo, max 15 words","kind":"Money|Taxi|Tour|Shop|Ticket|Other"}`;
}

// The model's answer -> { warning (a saved scam or null), seen, kind }, or null when it isn't readable.
export function readMatch(text, scams) {
  const a = jsonIn(text, "{", "}");
  if (!a || typeof a.match !== "string") return null;
  return { warning: scams.find((x) => x.id === a.match) || null, seen: str(a.seen, 120), kind: KINDS.includes(a.kind) ? a.kind : "Other" };
}

export function verdictFor(m) {
  const w = m.warning;
  if (!w) return { verdict: "unknown", why: LABEL.unknown, whatToDo: TIP[m.kind] || TIP.Other, saferOption: "", warning: null };
  return { verdict: w.level === "Avoid" ? "walk" : "careful", why: w.whatHappens || `${w.title}, reported in ${w.where}.`, whatToDo: w.whatToDo, saferOption: w.saferOption || "", warning: w };
}

export function researchPrompt(city, country, today) {
  return `Today is ${today}. A traveler just arrived in ${city}, ${country}. Search the web, especially reddit.com threads (r/travel, r/solotravel and the city's own subreddit), travel forums, official tourism and police pages, and recent news, for scams and rip-offs travelers report in ${city}.
Cover each kind: money exchange and ATMs, taxis and ride apps, airport arrivals, tours and tickets, shops and restaurants, street hustles and fake officials, pickpocketing spots.
Return ONLY a JSON list of up to 25 items, most reported first. Each item:
{"id":"short-kebab-id","title":"short name","kind":"Money|Taxi|Tour|Shop|Ticket|Other","level":"Avoid|Careful",
 "looksLike":["what you would SEE in a photo, 2-5 short phrases"],"where":"streets or places","whatHappens":"one or two sentences",
 "travelersSay":"what reports say, one sentence","whatToDo":"one plain instruction","saferOption":"a safer choice, or empty",
 "sources":["https://... pages you actually read"]}
Only include scams with at least one source page. Don't invent prices or places.`;
}

// The research answer -> a clean list. Items without what-it-looks-like, what-to-do or an https source are dropped.
export function readResearch(text) {
  const list = jsonIn(text, "[", "]");
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.flatMap((x) => {
    if (!x || typeof x !== "object") return [];
    const sources = (Array.isArray(x.sources) ? x.sources : []).filter((u) => typeof u === "string" && /^https:\/\/[^\s"<>]+$/.test(u)).slice(0, 5);
    const looksLike = (Array.isArray(x.looksLike) ? x.looksLike : []).map((s) => str(s, 80)).filter(Boolean).slice(0, 6);
    const title = str(x.title, 80), whatToDo = str(x.whatToDo, 300), id = slug(x.id || title);
    if (!title || !whatToDo || !id || !looksLike.length || !sources.length || seen.has(id)) return [];
    seen.add(id);
    return [{ id, title, kind: KINDS.includes(x.kind) ? x.kind : "Other", level: LEVELS[String(x.level).toLowerCase()] || "Careful", looksLike,
      where: str(x.where, 200), whatHappens: str(x.whatHappens), travelersSay: str(x.travelersSay), whatToDo, saferOption: str(x.saferOption, 200), sources }];
  });
}

// saved: { savedAt, scams, triedAt? } for this city, or null.
export function needsResearch(saved, now, online) {
  if (!online) return false;
  if (saved?.triedAt && now - saved.triedAt < HOUR) return false;
  return !saved?.scams?.length || now - (saved.savedAt || 0) > DAY;
}

export function mergeScams(builtIn, researched) {
  const ids = new Set(builtIn.map((s) => s.id)), titles = new Set(builtIn.map((s) => s.title.toLowerCase()));
  return [...builtIn, ...researched.filter((s) => !ids.has(s.id) && !titles.has(s.title.toLowerCase()))];
}
