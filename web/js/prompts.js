// PURE LOGIC: the text of Beacon web's AI prompts. The two templates are the same text as
// shared/prompts/ (Android and iOS use them too); tests/prompts.test.js fails if they differ.
// The model only rewrites or answers from what it is handed here. In the SOS it is never shown the
// location, the police number or the family link: js/messages.js adds those by code.

export const SOS_SENTENCE = `Rewrite this emergency note as one or two clear sentences for the person's family. At most 40 words.
Write in the third person about {name}. {refer}
Keep every fact from the note. Do NOT add facts, places, numbers, advice or greetings.
Answer with the sentences only.
Note from {name}: "{note}"`;

export const ASK_BEACON = `You are Beacon, a calm safety helper for a traveler in {city}, {country}. It is {clock}.
Answer the question using ONLY the facts below. Copy phone numbers and names exactly.
If asked whether the area is OK, use the distances and hours under "Streets to avoid", and name a safer street or place.
If the facts don't cover it, say "I don't have that saved. Police: {police}."
Write at most 3 short steps, plain words, no headings.

FACTS
Police: {police}. Ambulance: {ambulance}. Embassy: {embassyName}, {embassyPhone}.
Streets to avoid:
{zones}
Busier, safer streets: {safer}
Closest open safe places:
{places}
Local phrases:
{phrases}

EARLIER IN THIS CHAT
{chat}

QUESTION: {question}`;

// How the SOS sentence should refer to her: her name by default, never a guessed pronoun.
const REFER = {
  She: 'Use "she" and "her" after the first mention.',
  He: 'Use "he" and "him" after the first mention.',
  They: 'Use "they" and "them" after the first mention.',
  UseName: 'Use the name each time; do not use "he" or "she".',
};

// Fills {placeholders} in the order given. Put her own words last, so text she typed that happens to
// look like a placeholder cannot be filled in by a later value.
export function fill(template, values) {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, () => String(value)), template);
}

export function sosSentencePrompt(profile, note) {
  const name = (profile?.name || "").trim() || "Your contact";
  return fill(SOS_SENTENCE, { name, refer: REFER[profile?.pronoun] ?? REFER.UseName, note });
}
