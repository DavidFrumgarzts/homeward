// The scan check's knowledge and logic: reported scams with fair rates and prices, and the verdict.
// Same rules as the Android app (features/scancheck/ScanJudge.kt): the AI may only READ a photo;
// she confirms the number, and plain math against these saved numbers decides. Demo data, approximate.

export const KINDS = ["Money", "Taxi", "Tour", "Shop", "Ticket", "Other"];

export const scamPacks = {
  rio: {
    city: "Rio de Janeiro",
    scams: [
      { title: "Street money changers", kind: "Money", where: "Copacabana and Centro sidewalks", level: "Avoid",
        signs: ["cambio offered on the street", "better rate than the banks", "counting notes fast"],
        whatToDo: "Change money at a bank or an official casa de câmbio, or use an ATM inside a bank.",
        fairRates: [{ from: "USD", to: "BRL", rate: 5.4, walkAwayLossPercent: 8 }], reports: 3,
        sources: ["https://www.reddit.com/r/travel/search/?q=rio+money+exchange"] },
      { title: "Unofficial airport taxis", kind: "Taxi", where: "Galeão airport arrivals", level: "Careful",
        signs: ["driver approaches you inside the terminal", "no meter", "price given only after you get in"],
        whatToDo: "Use the official taxi desk or a ride app, and agree the price before you go.",
        fairPrices: [{ item: "taxi airport to Lapa", currency: "BRL", low: 90, high: 130 }], reports: 3,
        sources: ["https://www.reddit.com/r/rio/search/?q=airport+taxi"] },
      { title: "Card machine overcharge at beach kiosks", kind: "Shop", where: "Copacabana and Ipanema beach kiosks", level: "Avoid",
        signs: ["card machine turned away from you", "screen covered", "asked to type the PIN twice"],
        whatToDo: "Read the amount on the screen before you pay, or pay in cash.", reports: 4,
        sources: ["https://www.reddit.com/r/rio/search/?q=card+machine"] },
      { title: "\"Free\" bracelet, then a demand for money", kind: "Other", where: "Lapa steps and beach promenades", level: "Careful",
        signs: ["ties a bracelet on your wrist", "free gift", "asks for money after"],
        whatToDo: "Keep your hands to yourself, say \"Não, obrigado\" and keep walking.", saferOption: "5º DP police station", reports: 2,
        sources: ["https://www.reddit.com/r/solotravel/search/?q=rio+bracelet"] },
    ],
  },
  bucharest: {
    city: "Bucharest",
    scams: [
      { title: "Exchange offices with \"0% commission\" signs", kind: "Money", where: "Old Town (Lipscani) and around Piața Unirii", level: "Avoid",
        signs: ["0% commission", "big sell rate, small buy rate", "rate shown only for large amounts"],
        whatToDo: "Use a bank ATM and decline the conversion the machine offers.", saferOption: "a BCR bank ATM on Bd. Regina Elisabeta",
        fairRates: [{ from: "EUR", to: "RON", rate: 4.97, walkAwayLossPercent: 8 }, { from: "USD", to: "RON", rate: 4.6, walkAwayLossPercent: 8 }], reports: 3,
        sources: ["https://www.reddit.com/r/Romania/search/?q=exchange+office", "https://www.reddit.com/r/travel/search/?q=bucharest+exchange"] },
    ],
  },
};

const STOP = new Set(["the", "you", "your", "for", "and", "with", "only", "this", "that", "are", "from", "not", "after", "before", "please", "thank", "than", "get", "its", "our"]);
const words = (s) => new Set(String(s).toLowerCase().split(/[^\p{L}\p{N}%]+/u).filter((w) => w.length >= 3 && !STOP.has(w)));
const n2 = (x) => x.toFixed(2);

// "4,20" -> 4.2 and "1,500" -> 1500: a comma is a decimal point only when 1-2 digits follow it.
export function parseNumber(text) {
  const t = String(text).trim();
  const n = Number(/,\d{1,2}$/.test(t) ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, ""));
  return t && Number.isFinite(n) ? n : null;
}

export const LABEL = { fair: "Looks fair", careful: "Be careful", walk: "Walk away", unknown: "Nothing saved about this" };
const TIP = { Money: "Use a bank ATM and decline the conversion it offers.", Taxi: "Use the official taxi desk or a ride app, and agree the price first.",
  Tour: "Agree the full price before you start.", Shop: "Check the amount on the card machine before you pay.",
  Ticket: "Buy tickets only at the official counter.", Other: "If someone insists, say no and keep walking." };

// reading: { kind, text, rate: {from, to, buy}?, price: {currency, amount}? } -> { verdict, why, whatToDo, saferOption, warning }
export function judge(reading, scams) {
  const result = (verdict, why, w) => ({ verdict, why, whatToDo: w.whatToDo, saferOption: w.saferOption || "", warning: w });
  const r = reading.rate;
  if (r?.buy != null) for (const w of scams) {
    const fair = (w.fairRates || []).find((f) => f.from.toLowerCase() === r.from.toLowerCase() && f.to.toLowerCase() === r.to.toLowerCase());
    if (!fair) continue;
    const loss = Math.round(((fair.rate - r.buy) / fair.rate) * 100);
    const verdict = loss < 3 ? "fair" : loss <= fair.walkAwayLossPercent ? "careful" : "walk";
    const lossText = loss > 0 ? ` You'd lose about ${loss}% (100 ${fair.from} → ${Math.round(r.buy * 100)} ${fair.to}, not ${Math.round(fair.rate * 100)}).` : "";
    return result(verdict, `They buy 1 ${fair.from} for ${n2(r.buy)} ${fair.to}. A fair rate is about ${n2(fair.rate)}.${lossText}`, w);
  }
  const p = reading.price;
  if (p?.amount != null) for (const w of scams) {
    const fair = (w.fairPrices || []).find((f) => f.currency.toLowerCase() === p.currency.toLowerCase() && w.kind === reading.kind);
    if (!fair) continue;
    const verdict = p.amount <= fair.high ? "fair" : p.amount <= fair.high * 1.5 ? "careful" : "walk";
    return result(verdict, `They ask ${Math.round(p.amount)} ${fair.currency} for ${fair.item}. A fair price is about ${fair.low}–${fair.high} ${fair.currency}.`, w);
  }
  // No numbers: match what the sign says against the saved signs. Never "Looks fair" from words alone.
  const text = (reading.text || "").toLowerCase();
  if (text.trim()) {
    const seen = words(text);
    const scored = scams.map((w) => {
      const cues = w.signs || w.looksLike || []; // Reddit-researched items describe what they look like
      const phrase = cues.some((s) => text.includes(s.toLowerCase()));
      const shared = [...words([w.title, ...cues].join(" "))].filter((x) => seen.has(x)).length;
      return { w, ok: phrase || shared >= 2, score: (phrase ? 10 : 0) + shared };
    }).filter((s) => s.ok).sort((a, b) => b.score - a.score);
    if (scored[0]) { const w = scored[0].w; return result(w.level === "Avoid" ? "walk" : "careful", w.whatHappens || `${w.title}, reported in ${w.where}.`, w); }
  }
  return { verdict: "unknown", why: LABEL.unknown, whatToDo: TIP[reading.kind] || TIP.Other, saferOption: "", warning: null };
}

// The saved place Beacon recommends for a question, picked in code so the map blinks the same one the answer names.
export function recommends(question) {
  const q = question.toLowerCase();
  return /\b(safe|where|go|help|hostel|hospital|walk)\b/.test(q) || q.includes("police station");
}
