import { clampPage, wholeTotal } from "../pagination/pages.ts";
import type { PlDataTableColumn, PlDataTableRow } from "./data-table.ts";

const fold = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

/** Rows where any column's text contains `query`, ignoring case and accents. */
export function filterRows(
  rows: PlDataTableRow[],
  columns: PlDataTableColumn[],
  query: string,
): PlDataTableRow[] {
  const needle = fold(query.trim());
  if (!needle) return rows;
  return rows.filter((row) =>
    columns.some((column) => fold(row[column.key]).includes(needle)),
  );
}

/** The number of pages, at least 1; a `pageSize` of 0 or less is one page. */
export function pageCount(total: number, pageSize: number): number {
  return pageSize > 0 ? wholeTotal(Math.ceil(total / pageSize)) : 1;
}

/** The rows of a 1-based `page`, clamped to the last page; a `pageSize` of 0 or less returns all. */
export function pageRows<T>(rows: T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0) return rows;
  const start =
    (clampPage(page, pageCount(rows.length, pageSize)) - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}
