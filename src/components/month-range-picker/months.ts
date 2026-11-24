/*
 * Months as `yyyy-mm` strings and as month indexes (year × 12 + month − 1), so
 * moving by months or years is plain addition. A range value is two months
 * joined by a slash, `yyyy-mm/yyyy-mm`, the ISO 8601 interval form, start first.
 */

const MONTH = /^(\d{4})-(\d{2})$/;

/** The index of a `yyyy-mm` month, or undefined when it is not one. */
export function parseMonth(value: string | null | undefined) {
  const m = MONTH.exec(value ?? "");
  if (!m) return undefined;
  const [year, month] = [Number(m[1]), Number(m[2])];
  return year > 0 && month >= 1 && month <= 12
    ? year * 12 + month - 1
    : undefined;
}

export const toMonth = (index: number) =>
  `${String(Math.floor(index / 12)).padStart(4, "0")}-${String((index % 12) + 1).padStart(2, "0")}`;

/** The start and end indexes of a range value, ordered, or undefined when it is not one. */
export function parseRange(value: string | null | undefined) {
  const [a, b, ...rest] = (value ?? "").split("/");
  const start = parseMonth(a);
  const end = parseMonth(b);
  if (rest.length || start === undefined || end === undefined) return undefined;
  return start <= end ? ([start, end] as const) : ([end, start] as const);
}

/** The range value of two indexes, in either order. */
export const toRange = (a: number, b: number) =>
  `${toMonth(Math.min(a, b))}/${toMonth(Math.max(a, b))}`;

/** The month of an index at UTC midnight on its first day, for Intl. */
export const monthTime = (index: number) =>
  Date.UTC(Math.floor(index / 12), index % 12, 1);

/** The index of the current month in the viewer's time zone. */
export function thisMonth() {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}

export const clampMonth = (index: number, min?: number, max?: number) =>
  min !== undefined && index < min
    ? min
    : max !== undefined && index > max
      ? max
      : index;
