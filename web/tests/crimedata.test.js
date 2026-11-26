import { describe, it, expect } from "vitest";
import { sourceFor, boxAround, nycUrls, parseNyc, ukUrls, lastMonths, parseUk, describe as describeSrc } from "../js/crimedata.js";

// Trimmed copies of real replies (fields as the APIs send them).
const NYC_ROWS = [
  { latitude: "40.756", longitude: "-73.9865", ofns_desc: "ROBBERY" },
  { latitude: "40.7561", longitude: "-73.9866", ofns_desc: "FELONY ASSAULT" },
  { latitude: "40.7562", longitude: "-73.9867", ofns_desc: "GRAND LARCENY" },
  { latitude: "0", longitude: "0", ofns_desc: "ROBBERY" }, // not geocoded
  { ofns_desc: "ROBBERY" },
];
const UK_ROWS = [
  { category: "robbery", location: { latitude: "51.503587", longitude: "-0.105417", street: { id: 1682040, name: "On or near The Cut" } }, month: "2026-09" },
  { category: "theft-from-the-person", location: { latitude: "51.5051", longitude: "-0.0889", street: { id: 1, name: "On or near Supermarket" } }, month: "2026-09" },
  { category: "violent-crime", location: { latitude: "51.5052", longitude: "-0.0890", street: { id: 2, name: "On or near Further/higher Educational Building" } }, month: "2026-09" },
  { category: "robbery", location: { latitude: "0", longitude: "0", street: { name: "" } } },
];

describe("which police data covers a place", () => {
  it("New York by position; the UK only when the phone says gb (the box also covers Ireland)", () => {
    expect(sourceFor([40.758, -73.9855])).toBe("nyc");
    expect(sourceFor([51.5079, -0.0877], "gb")).toBe("uk");
    expect(sourceFor([53.35, -6.26], "ie")).toBe(null);
    expect(sourceFor([26.92, 75.79], "in")).toBe(null); // Jaipur: no crime layer, nothing invented
    expect(sourceFor([-22.91, -43.18], "br")).toBe(null);
  });
});

describe("New York (NYPD complaints, SODA)", () => {
  it("asks both datasets for street crime at night, outdoors, in the box, since the date", () => {
    const urls = nycUrls(boxAround([40.76, -73.98], 3.5), new Date("2025-09-30T00:00:00Z"));
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("/resource/5uac-w243.json");
    expect(urls[1]).toContain("/resource/qgea-i56i.json");
    const where = new URL(urls[0]).searchParams.get("$where");
    expect(where).toContain("'ROBBERY','FELONY ASSAULT'");
    expect(where).toContain("LARCENY,GRAND FROM PERSON");
    expect(where).toContain("loc_of_occur_desc!='INSIDE'");
    expect(where).toContain("cmplnt_fr_tm>='18:00:00' OR cmplnt_fr_tm<'06:00:00'");
    expect(where).toContain("cmplnt_fr_dt>='2025-09-30'");
    expect(where).not.toMatch(/RAPE|SEX/);
  });
  it("reads rows into points and drops the ones with no position", () => {
    expect(parseNyc(NYC_ROWS)).toEqual([
      { lat: 40.756, lng: -73.9865, kind: "robbery" },
      { lat: 40.7561, lng: -73.9866, kind: "assault" },
      { lat: 40.7562, lng: -73.9867, kind: "theft" },
    ]);
    expect(parseNyc({ error: true })).toEqual([]);
  });
});

describe("UK (data.police.uk)", () => {
  it("one URL per category and month, the last 3 months", () => {
    expect(lastMonths("2026-02", 3)).toEqual(["2026-02", "2026-01", "2025-12"]);
    const urls = ukUrls([51.5079, -0.0877], ["2026-09"]);
    expect(urls).toEqual([
      "https://data.police.uk/api/crimes-street/robbery?lat=51.50790&lng=-0.08770&date=2026-09",
      "https://data.police.uk/api/crimes-street/violent-crime?lat=51.50790&lng=-0.08770&date=2026-09",
      "https://data.police.uk/api/crimes-street/theft-from-the-person?lat=51.50790&lng=-0.08770&date=2026-09",
    ]);
  });
  it("keeps real street names, not the kind of place a point is snapped to", () => {
    expect(parseUk(UK_ROWS)).toEqual([
      { lat: 51.503587, lng: -0.105417, kind: "robbery", street: "The Cut" },
      { lat: 51.5051, lng: -0.0889, kind: "theft", street: "" },
      { lat: 51.5052, lng: -0.089, kind: "assault", street: "" },
    ]);
  });
  it("says where it comes from", () => {
    expect(describeSrc("nyc")).toMatchObject({ origin: "Police data", period: "last 12 months", night: true });
    expect(describeSrc("uk")).toMatchObject({ origin: "Police data", period: "last 3 months", night: false, licence: "Open Government Licence v3.0" });
  });
});
