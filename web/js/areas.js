// Areas to avoid at night, for routes and the map. Three sources:
//   - Beacon's list (TEAM_AREAS): written by the team for the demo cities, each with when it applies, why, and a
//     published source. It names real places, so an entry only ships once David has reviewed it (reviewed: true).
//   - Her own marks: drawn on the map in the live app, kept only on her phone, passed in as `mine`.
//   - Researched for her city from the web (js/arearesearch.js: official advice, news, police, travelers' posts),
//     each with at least 2 sources, passed in as `researched` ("Reported online").
// Rings are [[lat, lng], ...].

export const TEAM_AREAS = [
  {
    id: "rio-lapa-invalidos", city: "Rio de Janeiro", name: "Rua dos Inválidos and the quiet side streets of Lapa",
    ring: [[-22.90838, -43.18348], [-22.90838, -43.18149], [-22.91125, -43.18149], [-22.91125, -43.18348]],
    fromHour: 23, toHour: 5, why: "Robberies of tourists reported in Lapa; the side streets empty out after the bars close.",
    source: "https://safetravel.govt.nz/print/brazil", reviewed: false,
  },
  {
    id: "jaipur-nahargarh-road", city: "Jaipur", name: "Nahargarh Fort road",
    ring: [[26.9262, 75.8118], [26.9262, 75.8142], [26.9380, 75.8170], [26.9380, 75.8140]],
    fromHour: 19, toHour: 6, why: "An isolated hill road after dark; guides advise visiting in daylight or by taxi.",
    source: "https://way4i.com/tourist-safety-guides-2027/jaipur-india-tourist-safety-2027/", reviewed: false,
  },
  {
    id: "jaipur-sindhi-camp", city: "Jaipur", name: "Around Sindhi Camp bus stand",
    ring: [[26.9215, 75.7985], [26.9215, 75.8020], [26.9245, 75.8020], [26.9245, 75.7985]],
    fromHour: 22, toHour: 5, why: "Pickpocketing and touts reported around the bus stand late at night.",
    source: "https://way4i.com/tourist-safety-guides-2027/jaipur-india-tourist-safety-2027/", reviewed: false,
  },
];

// Does the area apply at this hour (0-23)? Hours can run past midnight (22 to 5). 0 to 24 = all day.
export function activeAt(area, hour) {
  const { fromHour: a, toHour: b } = area;
  if (a === b || (a === 0 && b === 24)) return true;
  return a < b ? hour >= a && hour < b : hour >= a || hour < b;
}

// The areas that apply in this city at this hour (hour null = all of them, for routes walked later that night),
// plus the ones she marked (always).
export function areasFor(city, hour, mine = [], list = TEAM_AREAS, researched = []) {
  const c = String(city || "").toLowerCase();
  const team = list.filter((a) => a.reviewed && a.city.toLowerCase() === c && (hour == null || activeAt(a, hour)))
    .map((a) => ({ name: a.name, ring: a.ring, why: a.why, source: a.source, origin: "Beacon's list" }));
  const web = researched.filter((a) => hour == null || activeAt(a, hour))
    .map((a) => ({ name: a.name, ring: a.ring, why: a.why, sources: a.sources, official: !!a.official, origin: "Reported online" }));
  return [...team, ...web, ...mine.map((m) => ({ name: m.name || "Marked by you", ring: m.ring, origin: "Marked by you" }))];
}
