import { expect, test } from "bun:test";
import { parseLevel } from "./level.ts";

test("levels 1 and 2 are accepted", () => {
  expect(parseLevel(1)).toBe(1);
  expect(parseLevel(2)).toBe(2);
});

test("a level 3 item throws in development", () => {
  expect(() => parseLevel(3)).toThrow(RangeError);
  expect(() => parseLevel(0)).toThrow(RangeError);
  expect(() => parseLevel("2")).toThrow(RangeError);
});

test("a level 3 item is treated as level 2 in production", () => {
  const env = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    expect(parseLevel(3)).toBe(2);
  } finally {
    process.env.NODE_ENV = env;
  }
});
