// PURE LOGIC: the emergency numbers for the country you're in, from its two-letter code (OpenStreetMap's
// country_code). Where a country isn't listed, 112: it reaches emergency services from most mobile phones
// in most of the world, and the screens say the number wasn't checked for this country.
const SAME = (n) => ({ police: n, ambulance: n });
const EU_112 = ["at", "be", "bg", "hr", "cy", "cz", "dk", "ee", "fi", "fr", "de", "gr", "hu", "ie", "it", "lv", "lt", "lu", "mt", "nl",
  "pl", "pt", "ro", "sk", "si", "es", "se", "is", "no", "ch", "li", "ru", "ua", "tr"];
const NUMBERS = {
  us: SAME("911"), ca: SAME("911"), mx: SAME("911"), ar: SAME("911"), ph: SAME("911"),
  gb: SAME("999"), au: SAME("000"), nz: SAME("111"),
  br: { police: "190", ambulance: "192" }, jp: { police: "110", ambulance: "119" }, cn: { police: "110", ambulance: "120" },
  il: { police: "100", ambulance: "101" }, eg: { police: "122", ambulance: "123" }, th: { police: "191", ambulance: "1669" },
  za: { police: "10111", ambulance: "10177" }, co: SAME("123"), pe: { police: "105", ambulance: "106" }, cl: { police: "133", ambulance: "131" },
  id: { police: "110", ambulance: "118" }, vn: { police: "113", ambulance: "115" }, ae: { police: "999", ambulance: "998" },
  sg: { police: "999", ambulance: "995" }, kr: { police: "112", ambulance: "119" }, ma: { police: "19", ambulance: "15" }, in: { police: "112", ambulance: "108" },
  ...Object.fromEntries(EU_112.map((cc) => [cc, SAME("112")])),
};

export function numbersFor(countryCode) {
  const n = NUMBERS[String(countryCode || "").toLowerCase()];
  return n ? { ...n, known: true } : { police: "112", ambulance: "112", known: false };
}
