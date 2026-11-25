// Small helpers for drawing screens as HTML text.

// Makes any text safe to put inside HTML (names, messages and AI answers are never trusted).
export const esc = (text) => String(text ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// The small "On this computer" / "Cloud" mark under an AI answer. "" when there is no label to show.
export const aiBadge = (label) => (label ? `<span class="badge ${label === "Cloud" ? "cloud" : "device"}">${esc(label)}</span>` : "");
