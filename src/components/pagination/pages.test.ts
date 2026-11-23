import { expect, test } from "bun:test";
import { clampPage, pageItems, wholeTotal } from "./pages.ts";

test("few pages are all shown", () => {
  expect(pageItems(1, 1)).toEqual([1]);
  expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

test("near the start the gap is at the end", () => {
  expect(pageItems(1, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20]);
  expect(pageItems(4, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20]);
});

test("near the end the gap is at the start", () => {
  expect(pageItems(20, 20)).toEqual([1, "gap", 16, 17, 18, 19, 20]);
  expect(pageItems(17, 20)).toEqual([1, "gap", 16, 17, 18, 19, 20]);
});

test("in the middle both sides have a gap", () => {
  expect(pageItems(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
});

test("a long range always shows seven items", () => {
  for (let page = 1; page <= 30; page++)
    expect(pageItems(page, 30)).toHaveLength(7);
});

test("page and total are whole and in range", () => {
  expect(wholeTotal(0)).toBe(1);
  expect(wholeTotal(Number.NaN)).toBe(1);
  expect(wholeTotal(4.9)).toBe(4);
  expect(clampPage(0, 5)).toBe(1);
  expect(clampPage(9, 5)).toBe(5);
  expect(clampPage(Number.NaN, 5)).toBe(1);
});
