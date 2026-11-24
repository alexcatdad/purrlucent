import { expect, test } from "bun:test";
import { filterRows, pageCount, pageRows } from "./data-table-model.ts";

const columns = [
  { key: "name", label: "Name" },
  { key: "city", label: "City" },
];

const rows = [
  { id: "1", name: "Ada", city: "Café Town" },
  { id: "2", name: "Grace", city: "Paris" },
];

test("filterRows matches any column ignoring case and accents", () => {
  expect(filterRows(rows, columns, "cafe")).toEqual([rows[0]!]);
  expect(filterRows(rows, columns, "GRACE")).toEqual([rows[1]!]);
  expect(filterRows(rows, columns, "zzz")).toEqual([]);
});

test("filterRows with empty query returns all rows", () => {
  expect(filterRows(rows, columns, "")).toBe(rows);
});

test("pageRows clamps a page past the end to the last page", () => {
  const ten = Array.from({ length: 10 }, (_, i) => i + 1);
  expect(pageRows(ten, 9, 4)).toEqual([9, 10]);
  expect(pageRows(ten, 1, 4)).toEqual([1, 2, 3, 4]);
  expect(pageRows(ten, 0, 4)).toEqual([1, 2, 3, 4]);
});

test("pageCount of zero rows is 1", () => {
  expect(pageCount(0, 4)).toBe(1);
  expect(pageCount(10, 4)).toBe(3);
});

test("pageRows with size 0 returns everything", () => {
  const some = [1, 2, 3];
  expect(pageRows(some, 2, 0)).toEqual(some);
  expect(pageCount(3, 0)).toBe(1);
});
