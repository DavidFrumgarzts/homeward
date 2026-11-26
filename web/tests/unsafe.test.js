import { describe, it, expect } from "vitest";
import { hotspots, zonesToShow, zoneLine, quietNote, crosses, inZone } from "../js/unsafe.js";
import { buildGraph, route, quietBits } from "../js/walkroute.js";

const NYC = { origin: "Police data", period: "last 12 months", night: true, source: "https://data.cityofnewyork.us/x" };
// n reports at one point (as police data often snaps them to the same spot).
const pile = (lat, lng, n, kind = "robbery", street = "") => Array.from({ length: n }, () => ({ lat, lng, kind, street }));
// Background: one report in each of 60 cells spread over ~3 km, so the "top 5%" cut means something.
const background = Array.from({ length: 60 }, (_, i) => ({ lat: 40.70 + (i % 10) * 0.003, lng: -74.0 + Math.floor(i / 10) * 0.004, kind: "theft" }));

describe("red zones from police reports", () => {
  it("a busy cell becomes a zone that says why, where from, and when", () => {
    const zones = hotspots([...background, ...pile(40.7581, -73.9856, 12), ...pile(40.7581, -73.9856, 3, "assault")], NYC);
    expect(zones).toHaveLength(1);
    const z = zones[0];
    expect(inZone([40.7581, -73.9856], z)).toBe(true);
    expect(z.count).toBe(15);
    expect(z.why).toBe("12 robberies and 3 assaults reported here at night in the last 12 months.");
    expect(z).toMatchObject({ origin: "Police data", name: "Busy for street crime at night", source: NYC.source, fromHour: 18, toHour: 6 });
  });
  it("needs at least 5 reports, however quiet the rest of the area is", () => {
    expect(hotspots([...background, ...pile(40.7581, -73.9856, 4)], NYC)).toEqual([]);
  });
  it("is relative to the area: when every cell is busy, only the top 5% are red", () => {
    const busyEverywhere = Array.from({ length: 100 }, (_, i) => pile(40.70 + (i % 10) * 0.003, -74.0 + Math.floor(i / 10) * 0.004, 6)).flat();
    const zones = hotspots([...busyEverywhere, ...pile(40.7581, -73.9856, 30)], NYC);
    expect(zones).toHaveLength(1);
    expect(inZone([40.7581, -73.9856], zones[0])).toBe(true);
  });
  it("touching busy cells merge into one rounded patch; far ones stay apart", () => {
    const zones = hotspots([...background, ...pile(40.7581, -73.9856, 10), ...pile(40.7593, -73.9856, 10), ...pile(40.7700, -73.9600, 9)], NYC);
    expect(zones).toHaveLength(2);
    expect(zones[0].count).toBe(20);
    expect(zones[0].rings).toHaveLength(2); // one square per busy cell, drawn as one rounded patch
  });
  it("names a zone after its most reported street when the data has one (UK)", () => {
    const zones = hotspots([...background, ...pile(51.5048, -0.0879, 8, "theft", "Borough High Street")], { origin: "Police data", period: "last 3 months", night: false });
    expect(zones[0].name).toBe("Around Borough High Street");
    expect(zones[0].why).toBe("8 street thefts reported here in the last 3 months.");
  });
});

// A zone 1 km north of her and one 4 km north.
const box = (lat, lng, d = 0.001) => [[lat - d, lng - d], [lat - d, lng + d], [lat + d, lng + d], [lat + d, lng - d]];
const her = [40.75, -73.99];
const near = { id: "near", origin: "Police data", name: "Near", ring: box(40.759, -73.99) };
const far = { id: "far", origin: "Police data", name: "Far", ring: box(40.786, -73.99) };

describe("which zones to draw", () => {
  it("within a 30-minute walk (2.4 km straight line without saved streets)", () => {
    expect(zonesToShow([near, far], her).map((z) => z.id)).toEqual(["near"]);
  });
  it("or on her planned route, however far", () => {
    const back = [her, [40.77, -73.99], [40.79, -73.99]];
    expect(zonesToShow([near, far], her, { lines: [back] }).map((z) => z.id)).toEqual(["near", "far"]);
  });
  it("with saved streets, walking distance counts: a zone close as the crow flies but a long walk away is left out", () => {
    // A river between her and the zone: the only bridge is 2 km east, so the walk is ~5 km.
    const P = (lat, lon) => ({ lat, lon });
    const ways = [
      { tags: { highway: "primary" }, geometry: [P(40.75, -73.99), P(40.75, -73.966)] },
      { tags: { highway: "primary" }, geometry: [P(40.75, -73.966), P(40.759, -73.966)] },
      { tags: { highway: "primary" }, geometry: [P(40.759, -73.966), P(40.759, -73.99)] },
    ];
    const g = buildGraph(ways);
    expect(zonesToShow([near], her).map((z) => z.id)).toEqual(["near"]);
    expect(zonesToShow([near], her, { graph: g })).toEqual([]);
  });
  it("a line crossing a zone without a point inside still counts", () => {
    expect(crosses([[40.757, -73.99], [40.761, -73.99]], near)).toBe(true);
    expect(crosses([[40.757, -73.98], [40.761, -73.98]], near)).toBe(false);
  });
});

describe("the route card", () => {
  const through = { path: [[40.757, -73.99], [40.761, -73.99]] }, around = { path: [[40.757, -73.98], [40.761, -73.98]] };
  it("says when the route passes a police-data zone, or goes around one", () => {
    expect(zoneLine(through, null, [near])).toBe("Passes a red zone from police data.");
    expect(zoneLine(through, null, [{ ...near, name: "Around The Cut" }])).toBe("Passes a red zone from police data (The Cut).");
    expect(zoneLine(around, through, [near])).toBe("Goes around a red zone from police data.");
    expect(zoneLine(around, around, [near])).toBe("");
  });
  it("ignores Beacon's list and her own marks (the route text already covers those)", () => {
    expect(zoneLine(through, null, [{ ...near, origin: "Marked by you" }])).toBe("");
  });
});

describe("quiet after dark (OpenStreetMap)", () => {
  it("unlit footpaths, underpasses and park paths", () => {
    expect(quietBits({ highway: "footway", lit: "no" })).toBe(1);
    expect(quietBits({ highway: "path" })).toBe(1);
    expect(quietBits({ highway: "footway", tunnel: "yes", lit: "yes" })).toBe(2);
    expect(quietBits({ highway: "footway" }, true)).toBe(4);
    expect(quietBits({ highway: "primary", lit: "no" })).toBe(0);
  });
  it("an amber note on the route, from the metres on each kind", () => {
    const P = (lat, lon) => ({ lat, lon });
    const park = { tags: { leisure: "park" }, geometry: [P(40.749, -73.991), P(40.749, -73.985), P(40.753, -73.985), P(40.753, -73.991), P(40.749, -73.991)] };
    const g = buildGraph([park, { tags: { highway: "footway", name: "Park path" }, geometry: [P(40.75, -73.99), P(40.752, -73.99)] }]);
    const r = route(g, [40.75, -73.99], [40.752, -73.99]);
    expect(r.quiet.park).toBeGreaterThan(200);
    expect(quietNote(r)).toBe("Part of this route is a path through a park, quiet after dark.");
    expect(quietNote({ quiet: { unlit: 300, underpass: 60, park: 0 } })).toBe("Part of this route is unlit footpath and an underpass, quiet after dark.");
    expect(quietNote({ quiet: { unlit: 20, underpass: 0, park: 0 } })).toBe("");
  });
});
