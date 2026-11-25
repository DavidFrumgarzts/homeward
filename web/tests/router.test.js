// Which address opens which page.
import { expect, test } from "vitest";
import { route } from "../js/router.js";

const ID = "0123456789abcdef0123456789abcdef";

test("the traveler's app is the default", () => {
  expect(route({ pathname: "/", search: "" })).toEqual({ name: "traveler", param: "" });
  expect(route({ pathname: "/", search: "?reset" }).name).toBe("traveler");
  expect(route({ pathname: "/index.html", search: "" }).name).toBe("traveler");
  expect(route().name).toBe("traveler");
});
test("the family view, as a path (hosting) and as a question-mark address (local server)", () => {
  expect(route({ pathname: `/f/${ID}`, search: "" })).toEqual({ name: "family", param: ID });
  expect(route({ pathname: `/f/${ID}/`, search: "" })).toEqual({ name: "family", param: ID });
  expect(route({ pathname: "/", search: `?f=${ID}` })).toEqual({ name: "family", param: ID });
  expect(route({ pathname: "/", search: `?emu&f=${ID}` })).toEqual({ name: "family", param: ID });
});
test("the demo", () => {
  expect(route({ pathname: "/demo", search: "" }).name).toBe("demo");
  expect(route({ pathname: "/", search: "?demo" }).name).toBe("demo");
});
test("unknown paths fall back to the traveler's app", () => {
  expect(route({ pathname: "/f/", search: "" }).name).toBe("traveler");
  expect(route({ pathname: "/plan", search: "" }).name).toBe("traveler"); // the planner comes later
});
