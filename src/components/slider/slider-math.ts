export interface Range {
  min: number;
  max: number;
  step: number;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

/** The nearest value on the step grid that starts at `min`, kept inside the range. */
export function snap(value: number, { min, max, step }: Range) {
  const places = Math.max(decimals(step), decimals(min));
  const onGrid = min + Math.round((value - min) / step) * step;
  return clamp(Number(onGrid.toFixed(places)), min, max);
}

/** A usable range from attribute input: a bad bound or step falls back, and max never sits below min. */
export function toRange(min: number, max: number, step: number): Range {
  const lo = Number.isFinite(min) ? min : 0;
  const hi = Number.isFinite(max) ? max : 100;
  return { min: lo, max: Math.max(lo, hi), step: step > 0 ? step : 1 };
}

/** The value as shown and submitted: on the step grid and in range, or the minimum when it is not a number. */
export const currentValue = (value: number, range: Range) =>
  Number.isFinite(value) ? snap(value, range) : range.min;

/** Where the value sits in the range, from 0 to 1. */
export const fractionOf = (value: number, { min, max }: Range) =>
  max > min ? clamp((value - min) / (max - min), 0, 1) : 0;

/**
 * The value at a position along the track, from 0 at the left to 1 at the
 * right. Under rtl the minimum is at the right.
 */
export function valueAt(position: number, range: Range, rtl: boolean) {
  const along = clamp(position, 0, 1);
  const fraction = rtl ? 1 - along : along;
  return snap(range.min + fraction * (range.max - range.min), range);
}

/** The value after a key, or undefined when the key does nothing. */
export function valueAfterKey(
  key: string,
  value: number,
  range: Range,
  rtl: boolean,
) {
  const page = Math.max(range.step, (range.max - range.min) / 10);
  const right = rtl ? -1 : 1;
  const delta: Record<string, number> = {
    ArrowRight: right * range.step,
    ArrowLeft: -right * range.step,
    ArrowUp: range.step,
    ArrowDown: -range.step,
    PageUp: page,
    PageDown: -page,
  };
  if (key === "Home") return range.min;
  if (key === "End") return range.max;
  return key in delta ? snap(value + delta[key]!, range) : undefined;
}
