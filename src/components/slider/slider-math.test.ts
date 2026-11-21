import { expect, test } from "bun:test";
import {
  clamp,
  fractionOf,
  snap,
  valueAfterKey,
  valueAt,
} from "./slider-math.ts";

const range = { min: 0, max: 100, step: 1 };

test("clamp keeps a value inside the bounds", () => {
  expect(clamp(-5, 0, 10)).toBe(0);
  expect(clamp(15, 0, 10)).toBe(10);
  expect(clamp(5, 0, 10)).toBe(5);
});

test("snap rounds to the step grid that starts at min", () => {
  expect(snap(37, { min: 0, max: 100, step: 25 })).toBe(25);
  expect(snap(38, { min: 0, max: 100, step: 25 })).toBe(50);
  expect(snap(7, { min: 3, max: 100, step: 5 })).toBe(8);
});

test("snap avoids floating point noise and stays in range", () => {
  expect(snap(0.3, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
  expect(snap(98, { min: 0, max: 100, step: 25 })).toBe(100);
  expect(snap(99, { min: 0, max: 90, step: 25 })).toBe(90);
});

test("fractionOf maps the range to 0..1 and survives an empty range", () => {
  expect(fractionOf(50, { min: 0, max: 200, step: 1 })).toBe(0.25);
  expect(fractionOf(5, { min: 5, max: 5, step: 1 })).toBe(0);
});

test("valueAt reads a position and mirrors it under rtl", () => {
  expect(valueAt(0.25, range, false)).toBe(25);
  expect(valueAt(0.25, range, true)).toBe(75);
  expect(valueAt(-1, range, false)).toBe(0);
  expect(valueAt(2, range, false)).toBe(100);
});

test("arrow keys move by one step, and left and right swap under rtl", () => {
  expect(valueAfterKey("ArrowRight", 10, range, false)).toBe(11);
  expect(valueAfterKey("ArrowLeft", 10, range, false)).toBe(9);
  expect(valueAfterKey("ArrowRight", 10, range, true)).toBe(9);
  expect(valueAfterKey("ArrowLeft", 10, range, true)).toBe(11);
  expect(valueAfterKey("ArrowUp", 10, range, true)).toBe(11);
  expect(valueAfterKey("ArrowDown", 10, range, true)).toBe(9);
});

test("Home and End jump to the ends", () => {
  expect(valueAfterKey("Home", 40, range, false)).toBe(0);
  expect(valueAfterKey("End", 40, range, false)).toBe(100);
});

test("page keys move by 10% of the range, at least one step", () => {
  expect(valueAfterKey("PageUp", 40, range, false)).toBe(50);
  expect(valueAfterKey("PageDown", 40, range, false)).toBe(30);
  const small = { min: 0, max: 5, step: 1 };
  expect(valueAfterKey("PageUp", 2, small, false)).toBe(3);
});

test("keys stop at the ends and other keys do nothing", () => {
  expect(valueAfterKey("ArrowRight", 100, range, false)).toBe(100);
  expect(valueAfterKey("ArrowLeft", 0, range, false)).toBe(0);
  expect(valueAfterKey("a", 10, range, false)).toBeUndefined();
});
