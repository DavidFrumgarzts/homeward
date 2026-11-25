// Draws the Lapa map as an SVG picture: light grey ground, white streets, parks, the red zone,
// small place badges with names, and your green dot with an arrow for the way you're going.
// Same drawing as the Android app (features/lapamap) and Figma ("Map/Lapa illustrated"),
// on the same 393 x 520 grid. The cream blocks and water are decoration, not real places.

const G = "#22A06B";

// Small badges: a rounded square in the place's color with a white symbol.
const SYMBOL = {
  police: '<path d="M13,6.3 l5,2 v3.7 c0,3.3 -2.2,5.5 -5,6.6 c-2.8,-1.1 -5,-3.3 -5,-6.6 v-3.7 z" fill="#fff"/>',
  hospital: '<rect x="11.2" y="7" width="3.6" height="12" rx="1" fill="#fff"/><rect x="7" y="11.2" width="12" height="3.6" rx="1" fill="#fff"/>',
  bar: '<path d="M7.6,7.8 h10.8 l-5.4,6 z" fill="#fff"/><path d="M13,13.8 v4.6 M10.2,18.8 h5.6" stroke="#fff" stroke-width="1.7" stroke-linecap="round" fill="none"/>',
  cathedral: '<path d="M13,6.6 v12.8 M9.2,10.6 h7.6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>',
  arcos: '<path d="M6.6,8.6 H19.4 M6.6,19.2 H19.4 M7.6,19 V14 a2.7,2.7 0 0 1 5.4,0 V19 M13,14 a2.7,2.7 0 0 1 5.4,0 V19" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  steps: '<path d="M6.8,19 h3.6 v-3.6 h3.6 v-3.6 h3.6 v-3.6 h1.8" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
};
const COLOR = { police: "#2F6BFF", hospital: "#E5484D", bar: "#F2994A", cathedral: "#8B6FE8", arcos: "#1FA89A", steps: "#E8589A" };

export function badge(kind, size = 26) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 26 26" aria-hidden="true"><rect width="26" height="26" rx="8.5" fill="#fff"/><rect x="2" y="2" width="22" height="22" rx="6.5" fill="${COLOR[kind]}"/>${SYMBOL[kind]}</svg>`;
}

const PLACES = [["bar", "Bar", 41, 128], ["cathedral", "Cathedral", 321, 138], ["police", "Police", 249, 298],
                ["hospital", "Hospital", 63, 318], ["arcos", "Arcos da Lapa", 334, 334], ["steps", "Selarón steps", 309, 418]];

function place([kind, name, cx, cy]) {
  return `<g transform="translate(${cx - 12},${cy - 12}) scale(${24 / 26})"><rect width="26" height="26" rx="8.5" fill="#fff"/><rect x="2" y="2" width="22" height="22" rx="6.5" fill="${COLOR[kind]}"/>${SYMBOL[kind]}</g>
    <text x="${cx}" y="${cy + 23}" class="place">${name}</text>`;
}
const tree = (x, y) => `<line x1="${x}" y1="${y + 4}" x2="${x}" y2="${y + 11}" stroke="#5E9B6B" stroke-width="1.6" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="6" fill="#A5D3A0" stroke="#5E9B6B" stroke-width="1.4"/>`;

const SMALL_STREETS = ["M-10 62 C 100 54, 250 70, 403 54", "M-10 154 C 120 148, 260 160, 403 150", "M-10 196 C 60 192, 100 198, 116 196",
  "M190 198 C 260 204, 330 196, 403 200", "M-10 336 C 120 328, 250 344, 403 334", "M-10 402 C 130 394, 260 408, 403 400",
  "M-10 462 C 130 454, 260 468, 403 460", "M38 -10 C 44 150, 30 350, 36 620", "M270 -10 C 276 160, 262 380, 268 620",
  "M340 -10 C 346 200, 330 400, 338 620", "M96 -10 C 100 60, 92 110, 96 154", "M-10 108 L 96 104", "M210 100 L 270 97 L 340 102 L 403 98",
  "M64 196 L 62 236", "M230 152 L 232 200", "M304 56 L 306 150", "M306 200 L 304 270", "M96 336 L 99 400", "M300 402 L 303 462",
  "M184 464 L 186 620", "M150 300 L 210 304", "M60 404 L 58 462", "M96 462 L 98 620", "M38 250 L 36 280", "M270 300 L 340 297",
  "M100 240 L 100 290 L 150 292", "M340 150 L 403 144"];

// Your green dot, with an arrow on the side you're going (heading = degrees clockwise from up, or null).
export function dotSvg(you, heading = null) {
  return `<circle class="pulse" cx="${you.x}" cy="${you.y}" r="14" fill="${G}" opacity=".2"/>
    ${heading === null ? "" : `<g transform="rotate(${heading} ${you.x} ${you.y})"><path d="M${you.x} ${you.y - 19} L${you.x + 6.5} ${you.y - 9} L${you.x - 6.5} ${you.y - 9} Z" fill="${G}" stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/></g>`}
    <circle cx="${you.x}" cy="${you.y}" r="9.5" fill="#fff"/><circle cx="${you.x}" cy="${you.y}" r="7" fill="${G}"/>`;
}

// you: {x, y} or null. overlay: extra SVG above the streets and under the badges (the story's route).
// top: extra SVG above everything (the story's moving dot).
export function mapSvg({ you = null, heading = null, zoneLabel = ["RED ZONE"], overlay = "", top = "" } = {}) {
  const dot = you ? dotSvg(you, heading) : "";
  return `<svg class="map" viewBox="0 0 393 520" preserveAspectRatio="xMidYMin slice" role="img" aria-label="Map of Lapa, Rio de Janeiro">
    <style>
      .place { font: 600 10px Inter, system-ui, sans-serif; fill: #3C4658; text-anchor: middle; paint-order: stroke; stroke: #fff; stroke-width: 2.5px; stroke-linejoin: round; }
      .caps { font: 600 10px Sora, system-ui, sans-serif; letter-spacing: .7px; text-anchor: middle; }
      .pulse { animation: pulse 1.8s linear infinite; transform-box: fill-box; transform-origin: center; }
      .ring { animation: ring 1.3s linear infinite; transform-box: fill-box; transform-origin: center; }
      @keyframes pulse { from { transform: scale(.85); opacity: .28; } to { transform: scale(1.6); opacity: .05; } }
      @keyframes ring { from { transform: scale(1); opacity: .5; } to { transform: scale(1.7); opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .pulse, .ring { animation: none; } }
    </style>
    <rect width="393" height="620" fill="#E9EBEE"/>
    <path d="M300 -10 C 330 20, 380 30, 410 70 L 410 -10 Z" fill="#CFE6CB"/>
    <path d="M14 292 C 44 278, 96 284, 106 312 C 114 340, 84 362, 50 358 C 20 354, 2 318, 14 292 Z" fill="#CFE6CB"/>
    <path d="M356 372 C 384 366, 410 378, 410 404 L 410 620 L 340 620 C 332 470, 338 392, 356 372 Z" fill="#CFE6CB"/>
    <path d="M158 66 L204 64 L204 98 L158 101 Z M276 208 L334 205 L333 244 L276 240 Z M44 409 L92 405 L93 456 L44 458 Z M216 344 L264 346 L263 394 L216 392 Z" fill="#FAF3DF"/>
    <rect x="222" y="424" width="42" height="26" rx="11" fill="#B9E0F7"/><rect x="50" y="66" width="38" height="30" rx="12" fill="#B9E0F7"/>
    <path d="M-10 498 C 40 486, 96 500, 124 530" stroke="#B9E0F7" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="M118 118 C 130 98, 176 96, 188 116 C 199 150, 197 200, 190 226 C 180 245, 130 245, 120 228 C 108 196, 108 150, 118 118 Z" fill="#F4C3BC"/>
    <g stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none">${SMALL_STREETS.map((d) => `<path d="${d}"/>`).join("")}</g>
    <g stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none"><path d="M150 -10 C 156 180, 144 380, 150 620"/><path d="M210 -10 C 214 180, 204 380, 210 620"/></g>
    <path d="M-10 232 C 90 238, 250 262, 403 290" stroke="#fff" stroke-width="16" fill="none" stroke-linecap="round"/>
    ${[[20, 306], [102, 316], [28, 334], [350, 10], [376, 36], [372, 410], [386, 446], [362, 470]].map(([x, y]) => tree(x, y)).join("")}
    ${overlay}
    <circle class="ring" cx="249" cy="298" r="13" fill="none" stroke="#2F6BFF" stroke-width="2"/>
    ${PLACES.map(place).join("")}
    <text class="caps" fill="#B4282D" x="153" y="124">${zoneLabel.map((line, i) => `<tspan x="153" dy="${i ? 12 : 0}">${line}</tspan>`).join("")}</text>
    <text class="caps" fill="#5E6880" transform="rotate(7.5 332 262)" x="332" y="262">AV. MEM DE SÁ</text>
    ${dot}${top}
  </svg>`;
}

// Turns a tap on the map into a spot on its grid.
export function tapToSpot(svg, event) {
  const p = svg.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
  const s = p.matrixTransform(svg.getScreenCTM().inverse());
  return { x: Math.max(8, Math.min(385, s.x)), y: Math.max(8, Math.min(512, s.y)) };
}

// Real GPS -> a spot on the drawn map, or null when you are not in Lapa. Same box as the Android app.
const WEST = -43.1860, EAST = -43.1770, NORTH = -22.90628, SOUTH = -22.91722;
export function gpsToSpot(lat, lng) {
  if (lng < WEST || lng > EAST || lat < SOUTH || lat > NORTH) return null;
  return { x: ((lng - WEST) / (EAST - WEST)) * 393, y: ((NORTH - lat) / (NORTH - SOUTH)) * 520 };
}

// A spot on the drawn map -> the GPS point it stands for (the reverse of gpsToSpot).
export function spotToGps(spot) {
  return { lat: NORTH - (spot.y / 520) * (NORTH - SOUTH), lng: WEST + (spot.x / 393) * (EAST - WEST) };
}

// Which way you moved between two spots: degrees clockwise from up, or null if you barely moved.
export function headingBetween(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (Math.hypot(dx, dy) < 1.5) return null;
  return (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
}
