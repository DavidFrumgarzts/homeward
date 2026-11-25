// PURE LOGIC: which part of Beacon web an address opens. Tested in tests/router.test.js.
//   /             the traveler's app (story, setup, map, Ask Beacon, SOS)
//   /f/{shareId}  the family view a trusted contact opens from the text message
//   /demo         the family view fed by a made-up, replayed incident
// On Firebase Hosting every path is served index.html. The plain local server
// (python3 -m http.server) cannot do that, so each page also works as a question-mark address:
// ?f={shareId} and ?demo.
// To add a page (the trip planner at /plan comes next), add one line to ROUTES and one case in app.js.
const ROUTES = [
  { name: "family", path: /^\/f\/([^/]+)\/?$/, query: "f" },
  { name: "demo", path: /^\/demo\/?$/, query: "demo" },
];

// Returns { name, param }. name is "traveler" when nothing else matches; param is "" unless the page takes one.
export function route({ pathname = "/", search = "" } = {}) {
  const query = new URLSearchParams(search);
  for (const r of ROUTES) {
    const byPath = pathname.match(r.path);
    if (byPath) return { name: r.name, param: decodeURIComponent(byPath[1] ?? "") };
    if (query.has(r.query)) return { name: r.name, param: query.get(r.query) ?? "" };
  }
  return { name: "traveler", param: "" };
}
