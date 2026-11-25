import { expect, test } from "bun:test";
import { displacementMap } from "./lens.ts";

// An odd-sized surface places a pixel at the optical centre.
const map = displacementMap(121, 121, 8);
const at = (x: number, y: number) => {
  const i = (y * 121 + x) * 4;
  return [map[i], map[i + 1]];
};

test("the middle does not move", () => {
  expect(at(60, 60)).toEqual([128, 128]);
});

test("the rim pulls the backdrop inward, along the normal", () => {
  const [lx, ly] = at(0, 60);
  expect(lx!).toBeGreaterThan(200);
  expect(ly).toBe(128);
  const [tx, ty] = at(60, 0);
  expect(tx).toBe(128);
  expect(ty!).toBeGreaterThan(200);
  const [rx] = at(120, 60);
  expect(rx!).toBeLessThan(56);
});

test("outside the rounded corner nothing moves", () => {
  expect(at(0, 0)).toEqual([128, 128]);
});

test("the interior magnifies around the centre of the surface", () => {
  const [left] = at(30, 60);
  const [right] = at(90, 60);
  expect(left!).toBeGreaterThan(132);
  expect(right!).toBe(255 - left!);
});
