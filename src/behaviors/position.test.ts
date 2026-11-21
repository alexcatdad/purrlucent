import { afterEach, beforeEach, expect, test } from "bun:test";
import { position } from "./position.ts";

const realDocument = globalThis.document;
const realGetComputedStyle = globalThis.getComputedStyle;
const VIEWPORT = { width: 400, height: 300 };

const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const anchorAt = (left: number, top: number, width = 80, height = 30) =>
  ({
    getBoundingClientRect: () => rect(left, top, width, height),
  }) as unknown as Element;

const overlay = (width = 120, height = 100) =>
  ({
    style: {} as Record<string, string>,
    getBoundingClientRect: () => rect(0, 0, width, height),
  }) as unknown as HTMLElement;

let direction = "ltr";
let margins: Record<string, string> = {};

beforeEach(() => {
  direction = "ltr";
  margins = {};
  Object.defineProperty(globalThis, "document", {
    value: {
      documentElement: {
        clientWidth: VIEWPORT.width,
        clientHeight: VIEWPORT.height,
      },
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, "getComputedStyle", {
    value: () => ({ direction, ...margins }),
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "document", {
    value: realDocument,
    configurable: true,
  });
  Object.defineProperty(globalThis, "getComputedStyle", {
    value: realGetComputedStyle,
    configurable: true,
  });
});

const place = (
  anchor: Element,
  el: HTMLElement,
  placement: Parameters<typeof position>[2],
) => {
  position(anchor, el, placement);
  return { top: el.style.top, left: el.style.left };
};

test("bottom-start sits below the anchor, aligned to its start edge", () => {
  expect(place(anchorAt(100, 50), overlay(), "bottom-start")).toEqual({
    top: "80px",
    left: "100px",
  });
});

test("bottom-end aligns the overlay's end edge to the anchor's end edge", () => {
  expect(place(anchorAt(200, 50), overlay(), "bottom-end")).toEqual({
    top: "80px",
    left: "160px",
  });
});

test("top-start sits above the anchor", () => {
  expect(place(anchorAt(100, 150), overlay(), "top-start")).toEqual({
    top: "50px",
    left: "100px",
  });
});

test("start and end mirror in a right-to-left anchor", () => {
  direction = "rtl";
  expect(place(anchorAt(200, 50), overlay(), "bottom-start")).toEqual({
    top: "80px",
    left: "160px",
  });
});

test("uses fixed positioning", () => {
  const el = overlay();
  position(anchorAt(100, 50), el, "bottom-start");
  expect(el.style.position).toBe("fixed");
});

test("measures the overlay after it is fixed, when its size depends on it", () => {
  // In flow the overlay stretches to 300px wide; once fixed it shrinks to 120px.
  const style = {} as Record<string, string>;
  const el = {
    style,
    getBoundingClientRect: () =>
      rect(0, 0, style.position === "fixed" ? 120 : 300, 100),
  } as unknown as HTMLElement;
  position(anchorAt(200, 50), el, "bottom-end");
  expect(el.style.left).toBe("160px");
});

test("flips to the top near the bottom edge", () => {
  expect(place(anchorAt(100, 250), overlay(), "bottom-start")).toEqual({
    top: "150px",
    left: "100px",
  });
});

test("flips to the bottom near the top edge", () => {
  expect(place(anchorAt(100, 10), overlay(), "top-start")).toEqual({
    top: "40px",
    left: "100px",
  });
});

test("the overlay's block margins are the gap on either side", () => {
  margins = { marginTop: "4px", marginBottom: "4px" };
  // The margin box starts at the anchor's edge, so the border box sits 4px away from it.
  expect(place(anchorAt(100, 50), overlay(), "bottom-start").top).toBe("80px");
  // Flipped: margin box 108px tall ends at the anchor's top (250), border box 4px above it.
  expect(place(anchorAt(100, 250), overlay(), "bottom-start").top).toBe(
    "142px",
  );
});

test("stays at least 8px inside every edge", () => {
  const cases = [
    anchorAt(0, 0),
    anchorAt(VIEWPORT.width - 80, 0),
    anchorAt(0, VIEWPORT.height - 30),
    anchorAt(VIEWPORT.width - 80, VIEWPORT.height - 30),
    anchorAt(-50, -50),
    anchorAt(VIEWPORT.width + 50, VIEWPORT.height + 50),
  ];
  for (const anchor of cases) {
    for (const placement of [
      "bottom-start",
      "bottom-end",
      "top-start",
      "top-end",
    ] as const) {
      const { top, left } = place(anchor, overlay(), placement);
      expect(parseFloat(top)).toBeGreaterThanOrEqual(8);
      expect(parseFloat(left)).toBeGreaterThanOrEqual(8);
      expect(parseFloat(top) + 100).toBeLessThanOrEqual(VIEWPORT.height - 8);
      expect(parseFloat(left) + 120).toBeLessThanOrEqual(VIEWPORT.width - 8);
    }
  }
});

test("bottom and top centre the overlay on the anchor", () => {
  expect(place(anchorAt(100, 50), overlay(), "bottom")).toEqual({
    top: "80px",
    left: "80px",
  });
  expect(place(anchorAt(100, 150), overlay(), "top")).toEqual({
    top: "50px",
    left: "80px",
  });
});

test("end sits beside the anchor, centred on it; start mirrors it", () => {
  expect(place(anchorAt(100, 100), overlay(), "end")).toEqual({
    top: "65px",
    left: "180px",
  });
  expect(place(anchorAt(200, 100), overlay(), "start")).toEqual({
    top: "65px",
    left: "80px",
  });
});

test("start and end swap in a right-to-left anchor", () => {
  direction = "rtl";
  expect(place(anchorAt(100, 100), overlay(), "start").left).toBe("180px");
});

test("a side placement flips when its side has no room and says which side it took", () => {
  expect(position(anchorAt(300, 100), overlay(), "end")).toBe("left");
  expect(position(anchorAt(10, 100), overlay(), "start")).toBe("right");
  expect(position(anchorAt(100, 250), overlay(), "bottom")).toBe("top");
  expect(position(anchorAt(100, 50), overlay(), "bottom")).toBe("bottom");
});

test("side and centred placements stay inside every edge", () => {
  for (const placement of ["top", "bottom", "start", "end"] as const) {
    for (const anchor of [
      anchorAt(0, 0),
      anchorAt(VIEWPORT.width - 80, VIEWPORT.height - 30),
    ]) {
      const { top, left } = place(anchor, overlay(), placement);
      expect(parseFloat(top)).toBeGreaterThanOrEqual(8);
      expect(parseFloat(left)).toBeGreaterThanOrEqual(8);
      expect(parseFloat(top) + 100).toBeLessThanOrEqual(VIEWPORT.height - 8);
      expect(parseFloat(left) + 120).toBeLessThanOrEqual(VIEWPORT.width - 8);
    }
  }
});

test("an overlay larger than the viewport pins to the inset", () => {
  expect(place(anchorAt(100, 100), overlay(500, 400), "bottom-start")).toEqual({
    top: "8px",
    left: "8px",
  });
});
