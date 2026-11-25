// PURE LOGIC, no AI: works out the kind of trouble from her words by looking for key words.
// Same words and same order as the Android app (features/incident/Situation.kt): the more urgent
// situation wins when two match. The answer is saved with the incident so the family view knows it.
// Checked against shared/test-vectors/situation.json.
const WORDS = [
  ["medical", ["hurt", "bleed", "injur", "sick", "faint", "breath", "ambulance", "hospital", "doctor", "pain", "unconscious", "allerg"]],
  ["vehicle", ["vehicle", "taxi", "uber", "driver", "car ", "in a car", "van ", "bus ", "won't stop", "wont stop", "wrong way", "let me out"]],
  ["followed", ["follow", "stalk", "behind me", "chasing", "watching me"]],
  ["harassment", ["harass", "touch", "grab", "grop", "shout", "threat", "leave me alone", "won't leave", "wont leave", "cornered"]],
  ["lost", ["lost", "don't know where", "dont know where", "can't find", "cant find", "no idea where"]],
];

export function pickSituation(description) {
  const text = ` ${description.toLowerCase()} `;
  return WORDS.find(([, keys]) => keys.some((key) => text.includes(key)))?.[0] ?? "other";
}
