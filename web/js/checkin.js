// What Beacon answers when a trusted person asks how she is. Pure wording; the facts come from her phone.
// facts: { name, near: "MI Road, Jaipur" | null, minutesAgo: number | null, walkedKm?: number,
//          plan?: { place, minutesLeft, home } | null, inDanger?: boolean }

const ago = (m) => (m <= 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`);

export function answerText(f) {
  if (!f.near || f.minutesAgo == null) return `Beacon doesn't know where ${f.name} is right now. Her phone has no recent location.`;
  const lines = [`${f.name} was near ${f.near} ${ago(f.minutesAgo)}.`];
  if (f.walkedKm) lines.push(`She walked ${f.walkedKm} km in the last hour.`);
  if (f.plan) lines.push(`She's on her way back from ${f.plan.place}, about ${f.plan.minutesLeft} min from ${f.plan.home}.`);
  lines.push(f.inDanger ? "In an area to avoid at night." : "Not in a dangerous area.");
  return lines.join(" ");
}

export function answerPrompt(f) {
  return `Write one short, calm message (max 40 words) for ${f.name}'s family about where she is. Use only the facts below; add nothing, no advice, no guesses. Copy places exactly.
FACTS
${answerText(f)}`;
}

const hhmm = (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export function waitingText(name, lastAnswerAt) {
  return `Waiting for ${name}'s phone · checking every minute${lastAnswerAt ? ` · last answer at ${hhmm(lastAnswerAt)}` : ""}`;
}

// Whether a question gets her location: at most once every 5 minutes per person, and never for a question
// older than an hour (it would be answered with today's position long after it was asked).
export function decide(q, { now, lastByViewer }) {
  if (now - (q.askedAtMillis || 0) > 3600_000) return "too-old";
  const last = lastByViewer[q.viewerUid];
  if (last && now - last < 5 * 60_000) return "too-often";
  return "answer";
}
