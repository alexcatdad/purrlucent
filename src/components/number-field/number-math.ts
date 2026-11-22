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

/** The decimal separator of a locale; an unknown locale tag falls back to the browser's. */
export function decimalSeparator(locale?: string) {
  let format: Intl.NumberFormat;
  try {
    format = new Intl.NumberFormat(locale);
  } catch {
    format = new Intl.NumberFormat();
  }
  return format.formatToParts(1.1).find((part) => part.type === "decimal")!
    .value;
}

/**
 * The typed text as a number: null when empty, NaN when it is not a number.
 * Under a separator other than ".", only that separator marks the decimals.
 */
export function parse(text: string, separator = ".") {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  if (separator === ".") return Number(trimmed);
  return trimmed.includes(".") ? NaN : Number(trimmed.replace(separator, "."));
}

/** The number as text with the locale's decimal separator; "" for no value. */
export const format = (value: number | null, separator = ".") =>
  value === null ? "" : String(value).replace(".", separator);

/**
 * The part of `data` that may be inserted between `before` and `after`:
 * digits, one decimal separator and a minus at the very start.
 */
export function filterTyped(
  data: string,
  before: string,
  after: string,
  separator: string,
) {
  if (before === "" && after.startsWith("-")) return "";
  let hasSeparator = (before + after).includes(separator);
  let kept = "";
  for (const char of data) {
    if (/^\d$/.test(char)) kept += char;
    else if (char === separator && !hasSeparator) {
      kept += char;
      hasSeparator = true;
    } else if (
      char === "-" &&
      before === "" &&
      kept === "" &&
      !after.startsWith("-")
    )
      kept += char;
  }
  return kept;
}

/** Steps moved by Page Up, Page Down and a Shift-press on a stepper button. */
export const PAGE_STEPS = 10;

/** The value after a key, or undefined when the key does nothing. */
export function valueAfterKey(
  key: string,
  value: number | null,
  bounds: Bounds,
) {
  const steps: Record<string, number> = {
    ArrowUp: 1,
    ArrowDown: -1,
    PageUp: PAGE_STEPS,
    PageDown: -PAGE_STEPS,
  };
  if (key === "Home") return bounds.min;
  if (key === "End") return bounds.max;
  return key in steps ? stepBy(value, steps[key]!, bounds) : undefined;
}
