// Two lists that are kept by hand and must not go stale:
//   - sw.js lists every file the page needs offline;
//   - web/fixtures/ holds copies of shared/fixtures/ (hosting only serves web/).
import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";

const web = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, web), "utf8");
const swFiles = JSON.parse(read("sw.js").match(/const FILES = (\[[\s\S]*?\]);/)[1]);

test("the service worker lists every file in js/", () => {
  const missing = readdirSync(new URL("js/", web)).filter((name) => name.endsWith(".js")).map((name) => `/js/${name}`).filter((path) => !swFiles.includes(path));
  expect(missing).toEqual([]);
});
test("the service worker lists the page, the styles and the fixtures, and nothing that does not exist", () => {
  for (const path of ["/", "/index.html", "/styles.css", ...readdirSync(new URL("fixtures/", web)).map((name) => `/fixtures/${name}`)]) expect(swFiles).toContain(path);
  for (const path of swFiles.filter((p) => p !== "/")) expect(() => read(path.slice(1))).not.toThrow();
});
test("the service worker never lists local settings", () => {
  expect(swFiles.filter((path) => /config/.test(path))).toEqual([]);
});
test("web/fixtures/ is an exact copy of shared/fixtures/", () => {
  const sharedDir = new URL("../../shared/fixtures/", import.meta.url);
  const names = readdirSync(sharedDir).filter((name) => name.endsWith(".json"));
  expect(readdirSync(new URL("fixtures/", web)).sort()).toEqual(names.sort());
  for (const name of names) expect(JSON.parse(read(`fixtures/${name}`)), `${name}: run  cp shared/fixtures/*.json web/fixtures/`).toEqual(JSON.parse(readFileSync(new URL(name, sharedDir), "utf8")));
});
