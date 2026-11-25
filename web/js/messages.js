// PURE LOGIC: every text a trusted contact can receive, word for word the same as the Android app
// (features/incident/IncidentMessages.kt). Phone numbers, coordinates, links and times are put in HERE,
// by code. The AI only ever rewrites the first sentence about what is happening.
// Times arrive as ready-made text ("1:56 AM"). Checked against shared/test-vectors/message-templates.json.
// A profile is { name, pronoun }: pronoun is "UseName" (the default), "She", "He" or "They".
// A fix is { point: { lat, lng }, takenAtMillis, accuracyMeters }.

// "-22.9133, -43.1801": always a dot, whatever the computer's language.
export const short = (point) => `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
export const mapsLink = (point) => `https://maps.google.com/?q=${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;

const displayName = (profile) => (profile?.name || "").trim() || "Your contact";
const objectForm = (profile) => ({ She: "her", He: "him", They: "them" }[profile?.pronoun] ?? displayName(profile));
const possessive = (profile) => ({ She: "her", He: "his", They: "their" }[profile?.pronoun] ?? `${displayName(profile)}'s`);
const lines = (...parts) => parts.filter((part) => part != null).join("\n");
const callLine = (profile, police) => `Call ${objectForm(profile)} now. If there is no answer, call ${police} (police).`;

// "Location: -22.9133, -43.1801 at 11:42 PM" + the map link; says so plainly when there is no fix.
function where(fix, fixTime, label) {
  if (!fix) return `${label}: unknown (no GPS fix yet).`;
  return `${label}: ${short(fix.point)}${fixTime ? ` at ${fixTime}` : ""}\nMap: ${mapsLink(fix.point)}`;
}

// The sentence used when no AI is available, or before it has answered.
export function plainSentence(profile, description) {
  const note = description.trim().replace(/[.!,;]+$/, "");
  return note ? `${displayName(profile)} needs help: ${note}.` : `${displayName(profile)} needs help.`;
}

// The full alert: what is happening, where and when, the family link (when there is one), what to do.
export function alertText(profile, sentence, fix, fixTime, police, familyLink = null) {
  return lines(sentence.trim(), where(fix, fixTime, "Location"), familyLink ? `Follow live: ${familyLink}` : null, callLine(profile, police));
}

// Sent only when she did not answer an urgent safety check. Fixed wording, never says a crime is happening.
export function autoAlert(profile, checkTime, fix, fixTime, reasons, police, familyLink = null) {
  return lines(
    `Beacon safety check: ${displayName(profile)} did not respond to a safety check at ${checkTime}.`,
    where(fix, fixTime, "Last location"),
    reasons.length ? `Why Beacon asked: ${reasons.join("; ")}.` : null,
    familyLink ? `Follow live: ${familyLink}` : null,
    callLine(profile, police),
  );
}

export function update(profile, fix, fixTime, pointsHeld) {
  const held = pointsHeld > 0 ? `\n${pointsHeld} location ${pointsHeld === 1 ? "point was" : "points were"} recorded while there was no signal.` : "";
  return `Beacon update: ${displayName(profile)} was here at ${fixTime}.\n${short(fix.point)}\n${mapsLink(fix.point)}${held}`;
}

export function batteryLow(profile, fix, fixTime) {
  return lines(`Beacon: ${displayName(profile)}'s phone battery is low. Updates may stop.`, where(fix, fixTime, "Last known location"));
}

export function ended(profile, time) {
  return `Beacon: ${displayName(profile)} says the SOS is over (${time}). Beacon has stopped sharing ${possessive(profile)} location.`;
}
