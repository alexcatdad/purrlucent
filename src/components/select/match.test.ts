import { expect, test } from "bun:test";
import { filterIndexes, matchIndex } from "./match.ts";

const labels = ["McIntosh", "Fuji", "Gala", "Granny Smith", "Honeycrisp"];

test("a first character finds the next option that starts with it", () => {
  expect(matchIndex(labels, "g", 0)).toBe(2);
});

test("repeating a character cycles through the matches and wraps", () => {
  expect(matchIndex(labels, "g", 2)).toBe(3);
  expect(matchIndex(labels, "g", 3)).toBe(2);
});

test("a longer query narrows from the current option, ignoring case", () => {
  expect(matchIndex(labels, "GR", 2)).toBe(3);
  expect(matchIndex(labels, "ga", 2)).toBe(2);
});

test("filtering lists the labels that start with the text, then those that contain it", () => {
  expect(filterIndexes(labels, "g")).toEqual([2, 3]);
  expect(filterIndexes(labels, "NY")).toEqual([3]);
  expect(filterIndexes(["Pineapple", "Apple", "Crab apple"], "app")).toEqual([
    1, 0, 2,
  ]);
});

test("filtering with no text keeps everything; no match gives nothing", () => {
  expect(filterIndexes(labels, "")).toEqual([0, 1, 2, 3, 4]);
  expect(filterIndexes(labels, "z")).toEqual([]);
});

test("no match gives -1", () => {
  expect(matchIndex(labels, "z", 0)).toBe(-1);
  expect(matchIndex([], "a", -1)).toBe(-1);
});
