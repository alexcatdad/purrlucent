import { describe, expect, test } from "bun:test";
import { parseDetents, settle, stepDetent } from "./detents.ts";

describe("parseDetents", () => {
  test("keeps known words, smallest first", () => {
    expect(parseDetents("large medium")).toEqual(["medium", "large"]);
    expect(parseDetents("medium")).toEqual(["medium"]);
  });

  test("ignores unknown words, empty and missing values", () => {
    expect(parseDetents("small huge")).toEqual([]);
    expect(parseDetents("")).toEqual([]);
    expect(parseDetents(null)).toEqual([]);
    expect(parseDetents(undefined)).toEqual([]);
  });
});

describe("stepDetent", () => {
  const both = parseDetents("medium large");

  test("moves to the neighbour", () => {
    expect(stepDetent(both, "medium", 1)).toBe("large");
    expect(stepDetent(both, "large", -1)).toBe("medium");
  });

  test("is undefined past either end", () => {
    expect(stepDetent(both, "large", 1)).toBeUndefined();
    expect(stepDetent(both, "medium", -1)).toBeUndefined();
    expect(stepDetent([], "medium", 1)).toBeUndefined();
  });
});

describe("settle", () => {
  const both = parseDetents("medium large");
  const rest = (dy: number, detent: "medium" | "large", detents = both) =>
    settle({ dy, velocity: 0, height: 400, detent, detents });

  test("a small drag snaps back", () => {
    expect(rest(20, "medium")).toBe("stay");
    expect(rest(-20, "large")).toBe("stay");
  });

  test("dragging up grows to the next detent, or stays at the largest", () => {
    expect(rest(-60, "medium")).toBe("large");
    expect(rest(-60, "large")).toBe("stay");
    expect(rest(-60, "medium", [])).toBe("stay");
  });

  test("dragging down shrinks one detent, or closes from the smallest", () => {
    expect(rest(100, "large")).toBe("medium");
    expect(rest(100, "medium")).toBe("close");
    expect(rest(100, "medium", [])).toBe("close");
  });

  test("dragging past half the height closes from any detent", () => {
    expect(rest(250, "large")).toBe("close");
  });

  test("a fast flick counts as a longer drag", () => {
    expect(
      settle({
        dy: 40,
        velocity: 2,
        height: 400,
        detent: "medium",
        detents: both,
      }),
    ).toBe("close");
    expect(
      settle({
        dy: -10,
        velocity: -1,
        height: 400,
        detent: "medium",
        detents: both,
      }),
    ).toBe("large");
  });
});
