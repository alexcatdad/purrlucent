import { expect, test } from "bun:test";
import { clamp, parse, snap, stepBy, valueAfterKey } from "./number-math.ts";

const bounds = { min: 0, max: 100, step: 1 };

test("clamp keeps a value inside the bounds and leaves open ends open", () => {
  expect(clamp(-5, 0, 10)).toBe(0);
  expect(clamp(15, 0, 10)).toBe(10);
  expect(clamp(-5)).toBe(-5);
});

test("snap rounds to the step grid that starts at min", () => {
  expect(snap(37, { min: 0, max: 100, step: 25 })).toBe(25);
  expect(snap(7, { min: 3, max: 100, step: 5 })).toBe(8);
  expect(snap(7, { step: 5 })).toBe(5);
});

test("snap avoids floating point noise and stays in range", () => {
  expect(snap(0.3, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
  expect(snap(0.1 + 0.2, { step: 0.1 })).toBe(0.3);
  expect(snap(99, { min: 0, max: 90, step: 25 })).toBe(90);
});

test("stepBy moves by steps, starts an empty field at 0 and stops at the ends", () => {
  expect(stepBy(5, 1, bounds)).toBe(6);
  expect(stepBy(5, -10, bounds)).toBe(0);
  expect(stepBy(null, 1, bounds)).toBe(1);
  expect(stepBy(100, 1, bounds)).toBe(100);
  expect(stepBy(1, -3, { step: 1 })).toBe(-2);
});

test("parse reads a number, an empty field and nonsense", () => {
  expect(parse(" 12.5 ")).toBe(12.5);
  expect(parse("-3")).toBe(-3);
  expect(parse("  ")).toBeNull();
  expect(parse("abc")).toBeNaN();
});

test("arrow keys step by one, page keys by ten steps", () => {
  expect(valueAfterKey("ArrowUp", 10, bounds)).toBe(11);
  expect(valueAfterKey("ArrowDown", 10, bounds)).toBe(9);
  expect(valueAfterKey("PageUp", 10, { ...bounds, step: 2 })).toBe(30);
  expect(valueAfterKey("PageDown", 10, bounds)).toBe(0);
});

test("Home and End go to the bounds only when they are set", () => {
  expect(valueAfterKey("Home", 40, bounds)).toBe(0);
  expect(valueAfterKey("End", 40, bounds)).toBe(100);
  expect(valueAfterKey("Home", 40, { step: 1 })).toBeUndefined();
  expect(valueAfterKey("a", 10, bounds)).toBeUndefined();
});
