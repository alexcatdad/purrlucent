import { expect, test } from "bun:test";
import {
  clampMonth,
  parseMonth,
  parseRange,
  toMonth,
  toRange,
} from "./months.ts";

test("a month reads to an index and back", () => {
  expect(parseMonth("2026-01")).toBe(2026 * 12);
  expect(parseMonth("2026-12")).toBe(2026 * 12 + 11);
  expect(toMonth(2026 * 12 + 11)).toBe("2026-12");
  expect(toMonth(parseMonth("0999-03")!)).toBe("0999-03");
});

test("anything that is not a month is no index", () => {
  for (const text of ["", "2026-13", "2026-00", "2026-1", "26-01", "0000-05"])
    expect(parseMonth(text)).toBeUndefined();
});

test("a range is two months, read in order", () => {
  expect(parseRange("2026-01/2026-03")).toEqual([2026 * 12, 2026 * 12 + 2]);
  expect(parseRange("2026-03/2026-01")).toEqual([2026 * 12, 2026 * 12 + 2]);
  expect(parseRange("2026-03/2026-03")).toEqual([2026 * 12 + 2, 2026 * 12 + 2]);
});

test("a half or broken range is no range", () => {
  for (const text of ["", "2026-01", "2026-01/", "2026-01/x", "a/b/c"])
    expect(parseRange(text)).toBeUndefined();
});

test("a range value is ordered whichever month came first", () => {
  expect(toRange(2026 * 12 + 4, 2025 * 12 + 10)).toBe("2025-11/2026-05");
});

test("clamping keeps a month inside min and max", () => {
  expect(clampMonth(5, 10, 20)).toBe(10);
  expect(clampMonth(25, 10, 20)).toBe(20);
  expect(clampMonth(15, 10, 20)).toBe(15);
  expect(clampMonth(15)).toBe(15);
});
