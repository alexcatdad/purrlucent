import { expect, test } from "bun:test";
import { matchesAccept, pickDropped } from "./file-match.ts";

const png = { name: "Cat.PNG", type: "image/png" };
const pdf = { name: "doc.pdf", type: "application/pdf" };

test("an empty or missing accept list takes every file", () => {
  expect(matchesAccept(png, undefined)).toBe(true);
  expect(matchesAccept(png, " , ")).toBe(true);
});

test("extensions match the end of the name, ignoring case", () => {
  expect(matchesAccept(png, ".png")).toBe(true);
  expect(matchesAccept(png, ".pdf, .PNG")).toBe(true);
  expect(matchesAccept(pdf, ".png")).toBe(false);
});

test("types match exactly and wildcards match the family", () => {
  expect(matchesAccept(png, "image/png")).toBe(true);
  expect(matchesAccept(png, "image/*")).toBe(true);
  expect(matchesAccept(pdf, "image/*")).toBe(false);
  expect(matchesAccept(pdf, "application/pdf")).toBe(true);
  expect(matchesAccept({ name: "x", type: "" }, "image/png")).toBe(false);
});

test("a drop keeps accepted files, and only the first without multiple", () => {
  const files = [pdf, png, { name: "b.png", type: "image/png" }];
  expect(pickDropped(files, "image/*", true)).toEqual([files[1]!, files[2]!]);
  expect(pickDropped(files, "image/*", false)).toEqual([files[1]!]);
  expect(pickDropped(files, undefined, false)).toEqual([pdf]);
  expect(pickDropped(files, ".txt", true)).toEqual([]);
});
