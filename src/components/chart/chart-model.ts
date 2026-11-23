import { areaY, barY, defineChart, group, lineY } from "@tanstack/charts";
import type { ChartDefinition } from "@tanstack/charts/lit";
import { decorative } from "@tanstack/charts/mark/decorative";
import { pie, polar, radialArc } from "@tanstack/charts/polar";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { tooltip } from "@tanstack/charts/tooltip";

// Everything that touches @tanstack/charts and holds no DOM lives here, so it
// can be unit-tested and so the d3-backed code stays inside this folder.

export const chartTypes = ["bar", "line", "area", "donut"] as const;
export type ChartType = (typeof chartTypes)[number];

export type ChartRow = Record<string, unknown>;

/** One drawn value. The original row rides along for events. */
export interface Observation {
  x: string;
  y: number;
  series: string;
  row: ChartRow;
}

export interface ChartSpec {
  type: ChartType;
  data: readonly ChartRow[];
  /** The key of the category. */
  x: string;
  /** The key of the value. Several keys, comma separated, make one series each (wide rows). */
  y: string;
  /** The key that names the series (long rows). */
  series?: string | undefined;
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  /** Formats a value for ticks, the tooltip and the table. */
  format?: ((value: number) => string) | undefined;
  /** Axis text size in pixels, read from the host's computed font. */
  fontSize?: number | undefined;
  /** No animation, whatever the definition says. */
  reducedMotion?: boolean | undefined;
}

const defaultFormat = (value: number) => value.toLocaleString();

/** A category as text: dates by their ISO day, everything else as written. */
export function categoryText(value: unknown): string {
  if (value instanceof Date)
    return Number.isNaN(value.getTime())
      ? ""
      : value.toISOString().slice(0, 10);
  return value == null ? "" : String(value);
}

/** Rows with a finite value, one per series. Wide rows (`y="a,b"`) become one observation per key. */
export function observe(spec: ChartSpec): Observation[] {
  const keys = spec.series
    ? [spec.y]
    : spec.y
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean);
  const fallback = spec.yLabel || spec.y;
  const out: Observation[] = [];
  for (const row of spec.data) {
    for (const key of keys) {
      const value = row[key];
      const y = typeof value === "number" ? value : Number(value);
      if (value == null || value === "" || !Number.isFinite(y)) continue;
      // A pie cannot draw a negative slice.
      if (spec.type === "donut" && y < 0) continue;
      out.push({
        x: categoryText(row[spec.x]),
        y,
        series: spec.series
          ? categoryText(row[spec.series])
          : keys.length > 1
            ? key
            : fallback,
        row,
      });
    }
  }
  return out;
}

/** The names the legend lists, in the order the palette is handed out: slices for a donut, series otherwise. */
export function legendNames(spec: ChartSpec, rows = observe(spec)): string[] {
  return [
    ...new Set(rows.map((o) => (spec.type === "donut" ? o.x : o.series))),
  ];
}

export interface TableModel {
  headers: string[];
  rows: string[][];
}

/** The same values as the drawing, as rows of text for a native table. */
export function tableModel(spec: ChartSpec): TableModel {
  const format = spec.format ?? defaultFormat;
  const rows = observe(spec);
  const xHeader = spec.xLabel || spec.x;
  if (spec.type === "donut")
    return {
      headers: [xHeader, spec.yLabel || spec.y],
      rows: rows.map((o) => [o.x, format(o.y)]),
    };
  const series = legendNames(spec, rows);
  const byX = new Map<string, Map<string, number>>();
  for (const o of rows) {
    const cells = byX.get(o.x) ?? new Map<string, number>();
    cells.set(o.series, o.y);
    byX.set(o.x, cells);
  }
  return {
    headers: [xHeader, ...series],
    rows: [...byX].map(([x, cells]) => [
      x,
      ...series.map((name) =>
        cells.has(name) ? format(cells.get(name) as number) : "",
      ),
    ]),
  };
}

/** The share of the radius the donut's hole takes. */
const holeRatio = 0.6;

/** A chart definition for the simple case: a type, rows and keys. */
export function buildDefinition(spec: ChartSpec): ChartDefinition {
  const rows = observe(spec);
  const format = spec.format ?? defaultFormat;
  const fontSize = spec.fontSize;
  const animation = spec.reducedMotion ? false : true;

  const tip = {
    use: tooltip,
    content: (
      points: readonly { datum: unknown; color?: string }[],
      context: { primaryPoint?: unknown },
    ) => {
      const first = points[0]?.datum as Observation | undefined;
      return {
        title: first?.x ?? "",
        rows: points.map((point) => {
          const o = point.datum as Observation;
          return {
            label: spec.type === "donut" ? spec.yLabel || spec.y : o.series,
            value: format(o.y),
            ...(point.color ? { color: point.color } : {}),
            active: point === context.primaryPoint,
          };
        }),
      };
    },
  };

  if (spec.type === "donut") {
    const slices = pie(rows, { value: "y" });
    return defineChart({
      marks: [
        polar({
          scales: { angle: null, radius: null },
          marks: [
            radialArc(slices, {
              key: "x",
              color: "x",
              innerRadius: ({ radius }) => radius * holeRatio,
              stroke: "var(--_slice-edge)",
              strokeWidth: 2,
            }),
          ],
        }),
      ],
      guides: false,
      scales: { x: null, y: null },
      svgAnimation: animation,
      tooltip: tip as never,
    }) as ChartDefinition;
  }

  const x = {
    scale: () =>
      spec.type === "bar"
        ? scaleBand<string>().padding(0.2)
        : scalePoint<string>().padding(0.4),
    axis: {
      ...(spec.xLabel ? { label: axisLabel(spec.xLabel, fontSize) } : {}),
      tickLabels: { thin: true, ...(fontSize ? { fontSize } : {}) },
    },
  };
  const y = {
    scale: scaleLinear,
    nice: true,
    grid: true,
    axis: {
      ...(spec.yLabel ? { label: axisLabel(spec.yLabel, fontSize) } : {}),
      ticks: { format: (value: number) => format(value) },
      tickLabels: { ...(fontSize ? { fontSize } : {}) },
    },
  };

  const channels = { x: "x", y: "y", z: "series" } as const;
  const marks =
    spec.type === "bar"
      ? [
          barY(
            rows,
            legendNames(spec, rows).length > 1
              ? { ...channels, layout: group({ padding: 0.1 }) }
              : channels,
          ),
        ]
      : spec.type === "area"
        ? [
            // The fill is paint only; the line owns focus, so a point is listed once.
            decorative(areaY(rows, { x: "x", y1: 0, y2: "y", z: "series" })),
            lineY(rows, { ...channels, points: true }),
          ]
        : [lineY(rows, { ...channels, points: true })];

  return defineChart({
    marks: marks as never,
    scales: { x, y } as never,
    focus: "group-x",
    // Hovering anywhere over a category picks it; the default 48px leaves gaps.
    maxFocusDistance: Number.POSITIVE_INFINITY,
    svgAnimation: animation,
    tooltip: tip as never,
  }) as ChartDefinition;
}

function axisLabel(text: string, fontSize: number | undefined) {
  return fontSize ? { text, fontSize } : text;
}

/**
 * A definition an author wrote, with what pl-chart promises added: a tooltip
 * when it has none, and no animation under reduced motion. Its focus and
 * keyboard settings stay as written; keyboard navigation is on unless it says
 * otherwise.
 */
export function withDefaults(
  definition: ChartDefinition,
  reducedMotion: boolean,
): ChartDefinition {
  const added: Record<string, unknown> = {};
  if (definition.tooltip === undefined) added.tooltip = tooltip;
  if (reducedMotion) added.svgAnimation = false;
  return Object.keys(added).length
    ? (defineChart(definition as never, added as never) as ChartDefinition)
    : definition;
}
