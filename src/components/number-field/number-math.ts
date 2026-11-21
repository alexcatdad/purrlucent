export interface Bounds {
  min?: number;
  max?: number;
  step: number;
}

export const clamp = (value: number, min = -Infinity, max = Infinity) =>
  Math.min(max, Math.max(min, value));

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

/** The nearest value on the step grid that starts at `min` (or 0), kept inside the bounds. */
export function snap(value: number, { min, max, step }: Bounds) {
  const base = min ?? 0;
  const places = Math.max(decimals(step), decimals(base));
  const onGrid = base + Math.round((value - base) / step) * step;
  return clamp(Number(onGrid.toFixed(places)), min, max);
}

/** The value after moving `steps` steps; an empty field starts from 0. */
export const stepBy = (value: number | null, steps: number, bounds: Bounds) =>
  snap((value ?? 0) + steps * bounds.step, bounds);

/** The typed text as a number: null when empty, NaN when it is not a number. */
export function parse(text: string) {
  const trimmed = text.trim();
  return trimmed === "" ? null : Number(trimmed);
}

/** The value after a key, or undefined when the key does nothing. */
export function valueAfterKey(
  key: string,
  value: number | null,
  bounds: Bounds,
) {
  const steps: Record<string, number> = {
    ArrowUp: 1,
    ArrowDown: -1,
    PageUp: 10,
    PageDown: -10,
  };
  if (key === "Home") return bounds.min;
  if (key === "End") return bounds.max;
  return key in steps ? stepBy(value, steps[key]!, bounds) : undefined;
}
