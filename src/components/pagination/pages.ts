export type PageItem = number | "gap";

/** The most items the control ever shows, gaps included. */
export const MAX_ITEMS = 7;

/** The whole page, clamped to 1..total; anything that is not a number is 1. */
export function clampPage(page: number, total: number): number {
  return Math.min(Math.max(Math.trunc(page) || 1, 1), total);
}

/** The whole page count, at least 1. */
export function wholeTotal(total: number): number {
  return Math.max(Math.trunc(total) || 1, 1);
}

/**
 * The page numbers to show, with `"gap"` where pages are left out. The first
 * and last page always show, and the list is a fixed length once there are more
 * pages than fit, so the control does not change width as the page moves.
 */
export function pageItems(page: number, total: number): PageItem[] {
  if (total <= MAX_ITEMS) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap", total];
  if (page >= total - 3)
    return [1, "gap", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "gap", page - 1, page, page + 1, "gap", total];
}
