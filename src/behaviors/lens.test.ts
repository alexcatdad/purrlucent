import { expect, test } from "bun:test";
import { displacementMap } from "./lens.ts";

// A 40×40 square with 8px corners; the bezel is 20px deep.
const map = displacementMap(40, 40, 8);
const at = (x: number, y: number) => {
  const i = (y * 40 + x) * 4;
  return [map[i], map[i + 1]];
};

test("the middle does not move", () => {
  expect(at(20, 20)).toEqual([128, 128]);
});

test("the rim pulls the backdrop inward, along the normal", () => {
  const [lx, ly] = at(0, 20);
  expect(lx!).toBeGreaterThan(200);
  expect(ly).toBe(128);
  const [tx, ty] = at(20, 0);
  expect(tx).toBe(128);
  expect(ty!).toBeGreaterThan(200);
  const [rx] = at(39, 20);
  expect(rx!).toBeLessThan(56);
});

test("outside the rounded corner nothing moves", () => {
  expect(at(0, 0)).toEqual([128, 128]);
});
