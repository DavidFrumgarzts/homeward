// The saved safety pack for Lapa, Rio de Janeiro: numbers, phrases, the red zone and safe places.
// Hand-made for the demo, same facts as the Android app's DemoRioPack. Check numbers before relying on them.
// Places sit on the drawn map's own grid (393 wide, 520 tall), not on real coordinates.
// tests/pack.test.js checks every fact here against shared/fixtures/rio-lapa-pack.json, so the web,
// Android and iOS demo packs cannot drift apart. Change the fixture and this file together.

export const pack = {
  city: "Rio de Janeiro",
  country: "Brazil",
  police: "190",
  ambulance: "192",
  embassy: { name: "U.S. Consulate General Rio de Janeiro", phone: "+55 21 3823-2000" },
  phrases: [["Help!", "Socorro!"], ["Call the police", "Chame a polícia"], ["I am being followed", "Estou sendo seguida"], ["I need a hospital", "Preciso de um hospital"]],
  zone: { name: "Rua dos Inválidos", fromHour: 23, toHour: 5, reason: "Bars close and the side streets go quiet", saferStreet: "Av. Mem de Sá",
          cx: 153, cy: 172, rx: 40, ry: 70 },
  places: [
    { name: "5º DP police station", kind: "police", x: 249, y: 298, open24h: true },
    { name: "Hospital Cruz Vermelha", kind: "hospital", x: 63, y: 318, open24h: true },
  ],
};

export const METERS_PER_STEP = 2.34; // one grid step on the drawn map is about this many metres
export const START = { x: 78, y: 153 }; // demo starting spot, just outside the bar

// Is the red zone risky at this hour? Its hours run overnight (11pm to 5am).
export function zoneRiskyAt(hour) {
  const z = pack.zone;
  return z.fromHour > z.toHour ? hour >= z.fromHour || hour < z.toHour : hour >= z.fromHour && hour < z.toHour;
}

// How close a spot is to the red zone: "inside", "near" (within about 65 m) or "far".
export function zoneCloseness(spot) {
  const z = pack.zone;
  const reach = (margin) => ((spot.x - z.cx) / (z.rx + margin)) ** 2 + ((spot.y - z.cy) / (z.ry + margin)) ** 2 <= 1;
  return reach(0) ? "inside" : reach(28) ? "near" : "far";
}

// The closest safe place to a spot, with the distance in metres.
export function nearestPlace(spot) {
  return pack.places
    .map((p) => ({ ...p, meters: Math.round(Math.hypot(p.x - spot.x, p.y - spot.y) * METERS_PER_STEP) }))
    .sort((a, b) => a.meters - b.meters)[0];
}

// 23 -> "11pm", 5 -> "5am"
export function clock(hour) {
  if (hour === 0 || hour === 24) return "midnight";
  if (hour === 12) return "noon";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}
