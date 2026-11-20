import { expect, test } from "bun:test";
import { pickValue } from "./pick-value.ts";

// bun has no DOM, so only the selection rule is tested here. The element's
// keyboard, pointer and direction behavior is tested in the browser:
// segmented-control.stories.ts and segmented-control.e2e.ts.
const segments = (selected = -1) =>
  ["day", "week", "month"].map((value, i) => ({
    value,
    selected: i === selected,
  }));

test("a matching value wins", () => {
  expect(pickValue(segments(0), "month")).toBe("month");
});

test("without a match the selected segment wins", () => {
  expect(pickValue(segments(1), "")).toBe("week");
  expect(pickValue(segments(1), "year")).toBe("week");
});

test("a required choice falls back to the first segment", () => {
  expect(pickValue(segments(), "")).toBe("day");
});

test("no segments means no value", () => {
  expect(pickValue([], "day")).toBeUndefined();
});
