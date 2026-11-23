/** The edge a column sticks to; `start` and `end` follow the writing direction. */
export type PlPin = "start" | "end";

export interface PlModelColumn {
  key: string;
  label: string;
  visible: boolean;
  canHide: boolean;
  pinned?: PlPin;
  grouped?: boolean;
  /** The width in pixels. */
  width?: number;
  resizable?: boolean;
}

export interface PlModelHeader {
  id: string;
  /** The column this heading belongs to; absent on a group heading. */
  column?: string;
  label: string;
  colSpan: number;
  rowSpan?: number;
  placeholder?: boolean;
  sortable?: boolean;
  sort?: "ascending" | "descending";
  filter?: { value: string; facets?: string[] };
  pinned?: PlPin;
  width?: number;
  resizable?: boolean;
}

export interface PlModelCell {
  id: string;
  column: string;
  value: unknown;
  colSpan?: number;
  rowSpan?: number;
  aggregate?: boolean;
  selected?: boolean;
  pinned?: PlPin;
}

export interface PlModelRow {
  id: string;
  depth: number;
  cells: PlModelCell[];
  pinned?: "top" | "bottom";
  selected?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  group?: { column: string; value: string; count: number };
}

/** A table to draw as it is: the app (or an adapter) decides every row, span and pin. */
export interface PlDataTableModel {
  columns: PlModelColumn[];
  headerGroups: PlModelHeader[][];
  rows: PlModelRow[];
  footer?: PlModelCell[];
  /** `total` is the number of pages. */
  page?: { page: number; total: number };
  filter?: string;
}
