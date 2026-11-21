import { expect, test } from "bun:test";
import { pickValue } from "./pick-value.ts";

// bun has no DOM, so only the selection rule is tested here. The element's
// keyboard, pointer and direction behavior is tested in the browser:
// toggle-group.stories.ts and toggle-group.e2e.ts.
const items = (selected = -1) =>
  ["day", "week", "month"].map((value, i) => ({
    value,
    selected: i === selected,
  }));

test("a matching value wins", () => {
  expect(pickValue(items(0), "month")).toBe("month");
});

test("without a match the selected item wins", () => {
  expect(pickValue(items(1), "")).toBe("week");
  expect(pickValue(items(1), "year")).toBe("week");
});

test("a required choice falls back to the first item", () => {
  expect(pickValue(items(), "")).toBe("day");
});

test("no items means no value", () => {
  expect(pickValue([], "day")).toBeUndefined();
});
