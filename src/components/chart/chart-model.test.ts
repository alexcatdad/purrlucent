import { expect, test } from "bun:test";
import { createChartScene } from "@tanstack/charts";
import {
  buildDefinition,
  categoryText,
  legendNames,
  observe,
  tableModel,
  withDefaults,
  type ChartRow,
  type ChartSpec,
  type ChartType,
} from "./chart-model.ts";

const long: ChartRow[] = [
  { month: "Jan", plan: "Free", users: 120 },
  { month: "Jan", plan: "Team", users: 80 },
  { month: "Feb", plan: "Free", users: 150 },
  { month: "Feb", plan: "Team", users: 95 },
  { month: "Mar", plan: "Free", users: 170 },
];
const wide: ChartRow[] = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
];

const spec = (type: ChartType, over: Partial<ChartSpec> = {}): ChartSpec => ({
  type,
  data: long,
  x: "month",
  y: "users",
  series: "plan",
  ...over,
});

const size = { width: 640, height: 360 };

for (const type of ["bar", "line", "area", "donut"] as const)
  test(`a ${type} chart draws a scene without throwing`, () => {
    const definition = buildDefinition(
      spec(type, type === "donut" ? { series: undefined } : {}),
    );
    const scene = createChartScene(definition as never, size);
    expect(scene.nodes.length).toBeGreaterThan(0);
  });

test("observe keeps finite values and names the series from the series key", () => {
  const rows = observe(
    spec("line", {
      data: [...long, { month: "Apr", plan: "Free", users: "n/a" }],
    }),
  );
  expect(rows).toHaveLength(5);
  expect(legendNames(spec("line"))).toEqual(["Free", "Team"]);
});

test("wide rows become one series per value key", () => {
  const s = spec("bar", {
    data: wide,
    y: "desktop, mobile",
    series: undefined,
  });
  expect(observe(s).map((o) => [o.x, o.series, o.y])).toEqual([
    ["Jan", "desktop", 186],
    ["Jan", "mobile", 80],
    ["Feb", "desktop", 305],
    ["Feb", "mobile", 200],
  ]);
});

test("a single series is named by the y label, else the y key", () => {
  const one = spec("line", { data: wide, y: "desktop", series: undefined });
  expect(legendNames(one)).toEqual(["desktop"]);
  expect(legendNames({ ...one, yLabel: "Desktop visits" })).toEqual([
    "Desktop visits",
  ]);
});

test("a donut drops negative values and lists its slices", () => {
  const s = spec("donut", {
    series: undefined,
    data: [
      { month: "Jan", users: 10 },
      { month: "Feb", users: -4 },
      { month: "Mar", users: 30 },
    ],
  });
  expect(legendNames(s)).toEqual(["Jan", "Mar"]);
});

test("the table pivots series into columns and leaves a missing cell empty", () => {
  expect(tableModel(spec("bar", { xLabel: "Month" }))).toEqual({
    headers: ["Month", "Free", "Team"],
    rows: [
      ["Jan", "120", "80"],
      ["Feb", "150", "95"],
      ["Mar", "170", ""],
    ],
  });
});

test("the table of a donut has one row per slice and uses the formatter", () => {
  const s = spec("donut", {
    series: undefined,
    data: [{ month: "Jan", users: 1200 }],
    format: (value) => `${value / 1000}k`,
  });
  expect(tableModel(s)).toEqual({
    headers: ["month", "users"],
    rows: [["Jan", "1.2k"]],
  });
});

test("categories are text; dates read as their ISO day", () => {
  expect(categoryText(new Date("2026-03-04T12:00:00Z"))).toBe("2026-03-04");
  expect(categoryText(7)).toBe("7");
  expect(categoryText(null)).toBe("");
});

test("withDefaults adds a tooltip and keeps an author's own", () => {
  const plain = buildDefinition(spec("line"));
  const bare = { ...plain, tooltip: undefined };
  expect(withDefaults(bare as never, false).tooltip).toBeDefined();
  expect(withDefaults(plain, false)).toBe(plain);
});

test("withDefaults turns animation off under reduced motion only", () => {
  const plain = buildDefinition(spec("line"));
  expect(withDefaults(plain, true).svgAnimation).toBe(false);
  expect(withDefaults(plain, false).svgAnimation).toBe(true);
});

test("reduced motion builds a definition without animation", () => {
  expect(
    buildDefinition(spec("line", { reducedMotion: true })).svgAnimation,
  ).toBe(false);
});
