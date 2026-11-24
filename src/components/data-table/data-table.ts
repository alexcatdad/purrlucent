import { LitElement, html, nothing, svg } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import "../button/button.ts";
import "../checkbox/checkbox.ts";
import "../combobox/combobox.ts";
import "../input/input.ts";
import "../menu/menu.ts";
import "../pagination/pagination.ts";
import { clampPage } from "../pagination/pages.ts";
import "../table/table.ts";
import { dataTableStyles } from "./data-table.css.ts";
import { filterRows, pageCount, pageRows } from "./data-table-model.ts";
import type {
  PlDataTableModel,
  PlModelCell,
  PlModelColumn,
  PlModelHeader,
  PlModelRow,
} from "./data-table-types.ts";
import { messages } from "../../behaviors/locale.ts";

export type * from "./data-table-types.ts";

export interface PlDataTableColumn {
  /** The row property this column shows. */
  key: string;
  /** The column heading. */
  label: string;
  /** The heading becomes a button that sorts by this column. */
  sortable?: boolean;
  /** `end` aligns numbers to the trailing edge. */
  align?: "start" | "end";
}

export type PlDataTableRow = Record<string, unknown>;

/**
 * Content for a cell: a string, a `Node` or a Lit template; `null` or
 * `undefined` keeps the text. A method-style signature, so a renderer that takes
 * only the row and column types of one mode is assignable.
 */
export type PlCellRenderer = {
  render(
    row: PlDataTableRow | PlModelRow,
    column: PlDataTableColumn | PlModelColumn,
  ): unknown;
}["render"];
export type PlSortDirection = "ascending" | "descending";

const glyph = {
  ascending: svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>`,
  descending: svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>`,
  none: svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></svg>`,
  collapsed: svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg>`,
  expanded: svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>`,
  more: svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01" /></svg>`,
};

/** A column is at least this many spacing units wide. */
const MIN_COLUMN = 10;

const collator = new Intl.Collator(undefined, { numeric: true });

const compare = (a: unknown, b: unknown) =>
  typeof a === "number" && typeof b === "number"
    ? a - b
    : collator.compare(String(a ?? ""), String(b ?? ""));

/**
 * A native table drawn from `columns` and `rows`, with sortable headings and
 * optional row selection. A sortable heading is a button inside its `<th>`,
 * and the sorted column carries `aria-sort`. A click sorts ascending; a click
 * on the sorted column reverses it. The rows are sorted here unless
 * `manual-sort` is set, which leaves the order to the app (which then answers
 * `pl-sort`). With `selectable`, each row has a checkbox and the header has a
 * select-all checkbox that shows mixed when some rows are selected. Every row
 * is rendered on its page; there is no virtualization. With no rows, the
 * `empty` slot (or `empty-label`) shows in place of the body.
 *
 * With `filterable`, a search field above the table keeps the rows whose text
 * contains the query, ignoring case and accents. The filter runs before the
 * sort, and select-all applies to the filtered rows. With `page-size`, the
 * rows are paged and a `pl-pagination` below the table moves through them; a
 * page past the end falls back to the last one. `manual-filter` and
 * `manual-pagination` show the state but leave the rows to the app, which
 * answers `pl-filter` and `pl-page`.
 *
 * With `model`, the table draws exactly that model: its header rows, spanning
 * cells, group rows (value and count), indented rows with a disclosure
 * button, aggregate footer, pinned rows and columns, and column widths. It
 * then ignores `columns`, `rows`, the sort, the filter and the paging logic,
 * and only reports `pl-sort`, `pl-filter`, `pl-page` and `pl-expand`; the app
 * answers with a new model. A pinned column needs a `width` so the ones after
 * it can sit beside it.
 *
 * In model mode each heading of a column also has a menu (sort, hide, move,
 * pin, group), a "Columns" menu above the table shows or hides columns, a
 * heading with a `filter` gets a combobox of its `facets`, and a `resizable`
 * heading gets a resize handle (a separator that a pointer drags and the arrow
 * keys move). With `row-menu` each row has a menu to pin it to the top or
 * bottom, and with `cell-select` the cells take a roving focus and shift-click
 * or shift-arrow selects a rectangle of them. The table never changes the
 * model itself: each of these reports an event and the app answers with a new
 * model.
 *
 * With `renderCell`, a function that returns a string, a `Node` or a Lit
 * template, a cell shows that in place of its text, so cells can hold links,
 * markers, checkboxes and buttons. It receives the row and the column: in model
 * mode a `PlModelRow` and a `PlModelColumn` (group rows and the footer keep
 * their text), otherwise a row object and a `PlDataTableColumn`. Returning
 * `null` or `undefined` keeps the text. Return a Lit template for interactive
 * content: a returned `Node` is replaced on every render. With `cell-select`,
 * the arrow keys move between cells only while a cell itself has focus;
 * interactive content in a cell stays in the tab order and keeps its own keys.
 *
 * @attr {string} caption - A visible caption that also names the table.
 * @attr {boolean} sticky-header - The headings stay at the top while the rows scroll; give the element a `max-block-size`.
 * @attr {boolean} selectable - Adds a checkbox column.
 * @attr {string} row-key - The row property that identifies a row in `selected` and `pl-selection-change`. Defaults to `id`; a row without it is identified by its index.
 * @attr {string} sort-column - The `key` of the sorted column.
 * @attr {string} sort-direction - `ascending` (default) or `descending`.
 * @attr {boolean} manual-sort - Do not reorder the rows; the app does it on `pl-sort`.
 * @attr {boolean} filterable - Shows a search field above the table.
 * @attr {string} filter-label - The search field's accessible name. Defaults to the page language's text (see `setMessages`), in English "Filter".
 * @attr {string} filter - The global filter query.
 * @attr {boolean} manual-filter - Do not filter the rows; the app does it on `pl-filter`.
 * @attr {number} page-size - Rows per page; 0 (default) shows every row and no pagination.
 * @attr {number} page - The current page, from 1. Defaults to 1; a page past the end is clamped.
 * @attr {boolean} manual-pagination - Do not slice the rows; the app does it on `pl-page`. `row-count` then gives the total.
 * @attr {number} row-count - With `manual-pagination`, the number of rows over all pages. Defaults to the number of rows given.
 * @attr {string} empty-label - The text shown when there are no rows and the `empty` slot is unused. Defaults to the page language's text (see `setMessages`), in English "No results".
 * @attr {string} select-all-label - The select-all checkbox's accessible name. Defaults to the page language's text (see `setMessages`), in English "Select all".
 * @attr {string} select-row-label - Prefix of each row checkbox's accessible name, followed by the row's first cell. Defaults to the page language's text (see `setMessages`), in English "Select".
 * @attr {string} expand-label - Prefix of each disclosure button's accessible name, followed by the row's first cell, in model mode. Defaults to the page language's text (see `setMessages`), in English "Expand".
 * @attr {string} columns-label - The text of the menu that shows and hides columns, in model mode. Defaults to the page language's text (see `setMessages`), in English "Columns".
 * @attr {string} column-menu-label - Prefix of each heading menu's accessible name, followed by the heading, in model mode. Defaults to the page language's text (see `setMessages`), in English "Column options".
 * @attr {string} resize-label - Prefix of each resize handle's accessible name, followed by the heading, in model mode. Defaults to the page language's text (see `setMessages`), in English "Resize".
 * @attr {boolean} row-menu - Gives each row a menu to pin it, in model mode.
 * @attr {string} row-menu-label - Prefix of each row menu's accessible name, followed by the row's first cell. Defaults to the page language's text (see `setMessages`), in English "Row options".
 * @attr {boolean} cell-select - The cells take a roving focus and shift-click or shift-arrow selects a rectangle, in model mode.
 * @slot empty - Content shown instead of the rows when there are none.
 * @fires {CustomEvent<{ column: string, direction: "ascending" | "descending" }>} pl-sort - A heading was activated. `detail.column` is the column key and `detail.direction` the new direction.
 * @fires {CustomEvent<{ column: string, visible: boolean }>} pl-column-visibility - A column was hidden or shown from a menu, in model mode.
 * @fires {CustomEvent<{ column: string, index: number }>} pl-column-order - A column was moved; `detail.index` is its new place among the model's columns.
 * @fires {CustomEvent<{ column: string, side: "start" | "end" | null }>} pl-column-pin - A column was pinned to a side, or unpinned (`null`).
 * @fires {CustomEvent<{ column: string, width: number }>} pl-column-resize - A column's resize handle moved; `detail.width` is the requested width in pixels.
 * @fires {CustomEvent<{ column: string, grouped: boolean }>} pl-column-group - A column was grouped or ungrouped from its menu.
 * @fires {CustomEvent<{ row: string, side: "top" | "bottom" | null }>} pl-row-pin - A row was pinned to the top or bottom, or unpinned (`null`).
 * @fires {CustomEvent<{ cells: string[] }>} pl-cell-select - The selected cell range changed. `detail.cells` holds the cell ids.
 * @fires {CustomEvent<{ keys: string[] }>} pl-selection-change - The selection changed through a checkbox. `detail.keys` holds the selected row keys, in row order.
 * @fires {CustomEvent<{ value: string, column?: string }>} pl-filter - A filter field changed. `detail.value` is the query; `detail.column` names the column of a heading filter, and is absent for the global one.
 * @fires {CustomEvent<{ page: number }>} pl-page - Another page was chosen. `detail.page` is the page.
 * @fires {CustomEvent<{ row: string, expanded: boolean }>} pl-expand - A disclosure button was activated in model mode. `detail.expanded` is the new state.
 */
export class PlDataTable extends LitElement {
  static override styles = dataTableStyles;
  static override properties = {
    columns: { attribute: false },
    rows: { attribute: false },
    selected: { attribute: false },
    caption: {},
    stickyHeader: { type: Boolean, reflect: true, attribute: "sticky-header" },
    selectable: { type: Boolean, reflect: true },
    rowKey: { attribute: "row-key" },
    sortColumn: { attribute: "sort-column", reflect: true },
    sortDirection: { attribute: "sort-direction", reflect: true },
    manualSort: { type: Boolean, attribute: "manual-sort" },
    filterable: { type: Boolean, reflect: true },
    filterLabel: { attribute: "filter-label" },
    filter: { reflect: true },
    manualFilter: { type: Boolean, attribute: "manual-filter" },
    pageSize: { type: Number, attribute: "page-size" },
    page: { type: Number, reflect: true },
    manualPagination: { type: Boolean, attribute: "manual-pagination" },
    rowCount: { type: Number, attribute: "row-count" },
    emptyLabel: { attribute: "empty-label" },
    selectAllLabel: { attribute: "select-all-label" },
    selectRowLabel: { attribute: "select-row-label" },
    expandLabel: { attribute: "expand-label" },
    columnsLabel: { attribute: "columns-label" },
    columnMenuLabel: { attribute: "column-menu-label" },
    resizeLabel: { attribute: "resize-label" },
    rowMenu: { type: Boolean, attribute: "row-menu" },
    rowMenuLabel: { attribute: "row-menu-label" },
    cellSelect: { type: Boolean, attribute: "cell-select" },
    model: { attribute: false },
    renderCell: { attribute: false },
    focusCell: { state: true },
  };

  declare columns: PlDataTableColumn[];
  declare rows: PlDataTableRow[];
  /** The keys of the selected rows. */
  declare selected: string[];
  declare caption: string | undefined;
  declare stickyHeader: boolean;
  declare selectable: boolean;
  declare rowKey: string;
  declare sortColumn: string | undefined;
  declare sortDirection: PlSortDirection;
  declare manualSort: boolean;
  declare filterable: boolean;
  declare filterLabel: string;
  declare filter: string;
  declare manualFilter: boolean;
  declare pageSize: number;
  declare page: number;
  declare manualPagination: boolean;
  declare rowCount: number | undefined;
  declare emptyLabel: string;
  declare selectAllLabel: string;
  declare selectRowLabel: string;
  declare expandLabel: string;
  declare columnsLabel: string;
  declare columnMenuLabel: string;
  declare resizeLabel: string;
  declare rowMenu: boolean;
  declare rowMenuLabel: string;
  declare cellSelect: boolean;
  /** A table to draw as it is; see the class description. */
  declare model: PlDataTableModel | undefined;
  /** Draws a cell's content in place of its text; see the class description. */
  declare renderCell: PlCellRenderer | undefined;
  /** The id of the cell that holds the roving tab stop. */
  declare focusCell: string | undefined;

  /** The cell a shift-click or shift-arrow range grows from. */
  #anchor: string | undefined;
  #drag: { column: string; x: number; width: number } | undefined;
  /** The cell that holds the tab stop while `cell-select` is on. */
  #stop: string | undefined;

  constructor() {
    super();
    this.columns = [];
    this.rows = [];
    this.selected = [];
    this.stickyHeader = false;
    this.selectable = false;
    this.rowKey = "id";
    this.sortDirection = "ascending";
    this.manualSort = false;
    this.filterable = false;
    this.filterLabel = "";
    this.filter = "";
    this.manualFilter = false;
    this.pageSize = 0;
    this.page = 1;
    this.manualPagination = false;
    this.emptyLabel = "";
    this.selectAllLabel = "";
    this.selectRowLabel = "";
    this.expandLabel = "";
    this.columnsLabel = "";
    this.columnMenuLabel = "";
    this.resizeLabel = "";
    this.rowMenu = false;
    this.rowMenuLabel = "";
    this.cellSelect = false;
  }

  #key(row: PlDataTableRow, index: number) {
    return String(row[this.rowKey] ?? index);
  }

  /** Every row in display order, each with its key. */
  get #sorted() {
    const view = this.rows.map((row, index) => ({
      row,
      key: this.#key(row, index),
    }));
    if (this.manualSort || !this.sortColumn) return view;
    const column = this.sortColumn;
    const sign = this.sortDirection === "descending" ? -1 : 1;
    return view.sort((a, b) => sign * compare(a.row[column], b.row[column]));
  }

  /** The rows that match the filter, over all pages, in display order. */
  get #view() {
    const sorted = this.#sorted;
    if (this.manualFilter || !this.filter.trim()) return sorted;
    const kept = new Set(filterRows(this.rows, this.columns, this.filter));
    return sorted.filter((v) => kept.has(v.row));
  }

  #pages(matching: number) {
    return pageCount(
      this.manualPagination ? (this.rowCount ?? this.rows.length) : matching,
      this.pageSize,
    );
  }

  /** The built-in text in the table's language, with the label attributes set on it on top. Resolved once per update. */
  #text = messages(this);

  protected override willUpdate() {
    const own = messages(this);
    this.#text = {
      ...own,
      filter: this.filterLabel || own.filter,
      noResults: this.emptyLabel || own.noResults,
      selectAll: this.selectAllLabel || own.selectAll,
      select: this.selectRowLabel || own.select,
      expand: this.expandLabel || own.expand,
      columns: this.columnsLabel || own.columns,
      columnOptions: this.columnMenuLabel || own.columnOptions,
      resize: this.resizeLabel || own.resize,
      rowOptions: this.rowMenuLabel || own.rowOptions,
    };
    // A filter that leaves fewer rows than the page needs moves to the last page.
    if (!this.model && this.pageSize > 0)
      this.page = clampPage(this.page, this.#pages(this.#view.length));
  }

  protected override updated() {
    if (this.model) this.#stickRows();
  }

  /** Heading rows stack as they stick; pinned rows sit below them and stack in order. */
  #stickRows() {
    const root = this.renderRoot;
    let top = 0;
    for (const tr of root.querySelectorAll<HTMLElement>("thead tr")) {
      tr.style.setProperty("--head-pin", `${top}px`);
      top += tr.offsetHeight;
    }
    if (!this.stickyHeader) top = 0;
    for (const tr of root.querySelectorAll<HTMLElement>(
      "tr[data-row-pin=top]",
    )) {
      tr.style.setProperty("--row-pin", `${top}px`);
      top += tr.offsetHeight;
    }
    let bottom = 0;
    for (const tr of [
      ...root.querySelectorAll<HTMLElement>("tr[data-row-pin=bottom]"),
    ].reverse()) {
      tr.style.setProperty("--row-pin", `${bottom}px`);
      bottom += tr.offsetHeight;
    }
  }

  #emit<T>(name: string, detail: T) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true }),
    );
  }

  #sort(column: PlDataTableColumn) {
    this.sortDirection =
      this.sortColumn === column.key && this.sortDirection === "ascending"
        ? "descending"
        : "ascending";
    this.sortColumn = column.key;
    this.#emit("pl-sort", {
      column: column.key,
      direction: this.sortDirection,
    });
  }

  #select(keys: Set<string>) {
    // Row order, and only rows that exist.
    this.selected = this.#sorted.map((v) => v.key).filter((k) => keys.has(k));
    this.#emit("pl-selection-change", { keys: [...this.selected] });
  }

  // The inner controls' own events would reach the app as if the table were one.
  #onFilter = (event: CustomEvent<{ value: string }>) => {
    event.stopPropagation();
    // A model is the whole state: the app answers with a new one.
    if (this.model) return this.#emit("pl-filter", event.detail);
    this.filter = event.detail.value;
    this.#emit("pl-filter", { value: this.filter });
    this.#goto(1);
  };

  #onPage = (event: CustomEvent<{ page: number }>) => {
    event.stopPropagation();
    this.#goto(event.detail.page);
  };

  #goto(page: number) {
    if (this.model) {
      if (page !== this.model.page?.page) this.#emit("pl-page", { page });
      return;
    }
    if (page === this.page) return;
    this.page = page;
    this.#emit("pl-page", { page });
  }

  // The checkbox's own events would reach the app as if the table were one.
  #contain(event: Event) {
    event.stopPropagation();
  }

  #onAll = (event: CustomEvent<{ checked: boolean }>) => {
    event.stopPropagation();
    // Select all acts on the filtered rows and keeps the rest of the selection.
    const keys = new Set(this.selected);
    for (const { key } of this.#view)
      if (event.detail.checked) keys.add(key);
      else keys.delete(key);
    this.#select(keys);
  };

  #onRow(key: string, event: CustomEvent<{ checked: boolean }>) {
    event.stopPropagation();
    const keys = new Set(this.selected);
    if (event.detail.checked) keys.add(key);
    else keys.delete(key);
    this.#select(keys);
  }

  #heading(column: PlDataTableColumn) {
    const sorted = this.sortColumn === column.key;
    return html`<th
      scope="col"
      align=${ifDefined(column.align)}
      aria-sort=${ifDefined(sorted ? this.sortDirection : undefined)}
    >
      ${
        column.sortable
          ? html`<button type="button" @click=${() => this.#sort(column)}>
              ${column.label}${glyph[sorted ? this.sortDirection : "none"]}
            </button>`
          : column.label
      }
    </th>`;
  }

  #filterField(value: string) {
    return this.filterable
      ? html`<pl-input
          type="search"
          class="filter"
          label=${this.#text.filter}
          .value=${value}
          @pl-input=${this.#onFilter}
          @pl-change=${this.#contain}
          @input=${this.#contain}
          @change=${this.#contain}
        ></pl-input>`
      : nothing;
  }

  #pager(page: number, total: number) {
    return html`<pl-pagination
      class="pages"
      .page=${page}
      .total=${total}
      @pl-change=${this.#onPage}
      @input=${this.#contain}
      @change=${this.#contain}
    ></pl-pagination>`;
  }

  /** The inline offset of each pinned column: the widths of the pinned columns before it. */
  #offsets(columns: PlModelColumn[]) {
    const offsets = new Map<string, number>();
    let start = 0;
    for (const c of columns)
      if (c.visible && c.pinned === "start") {
        offsets.set(c.key, start);
        start += c.width ?? 0;
      }
    let end = 0;
    for (const c of [...columns].reverse())
      if (c.visible && c.pinned === "end") {
        offsets.set(c.key, end);
        end += c.width ?? 0;
      }
    return offsets;
  }

  /** The pixel length of a CSS length, measured where it applies. */
  #px(from: Element, length: string) {
    const probe = document.createElement("span");
    probe.style.cssText = `position:absolute;visibility:hidden;inline-size:${length}`;
    from.append(probe);
    const px = probe.getBoundingClientRect().width;
    probe.remove();
    return px;
  }

  #onColumnMenu(
    column: PlModelColumn,
    index: number,
    event: CustomEvent<{ value: string }>,
  ) {
    event.stopPropagation();
    const key = column.key;
    const value = event.detail.value;
    if (value === "ascending" || value === "descending")
      this.#emit("pl-sort", { column: key, direction: value });
    else if (value === "hide")
      this.#emit("pl-column-visibility", { column: key, visible: false });
    else if (value === "earlier")
      this.#emit("pl-column-order", { column: key, index: index - 1 });
    else if (value === "later")
      this.#emit("pl-column-order", { column: key, index: index + 1 });
    else if (value === "start" || value === "end")
      this.#emit("pl-column-pin", { column: key, side: value });
    else if (value === "unpin")
      this.#emit("pl-column-pin", { column: key, side: null });
    else if (value === "group")
      this.#emit("pl-column-group", { column: key, grouped: !column.grouped });
  }

  #onColumns = (event: CustomEvent<{ value: string }>) => {
    event.stopPropagation();
    const column = this.model?.columns.find(
      (c) => c.key === event.detail.value,
    );
    if (column)
      this.#emit("pl-column-visibility", {
        column: column.key,
        visible: !column.visible,
      });
  };

  #onRowMenu(row: string, event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    const side = { top: "top", bottom: "bottom", unpin: null }[
      event.detail.value as "top" | "bottom" | "unpin"
    ];
    this.#emit("pl-row-pin", { row, side });
  }

  #onColumnFilter(column: string, event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    this.#emit("pl-filter", { value: event.detail.value, column });
  }

  #resize(column: string, width: number, from: Element) {
    const min = this.#px(from, `calc(var(--pl-spacing) * ${MIN_COLUMN})`);
    const next = Math.round(Math.max(min, width));
    if (next !== this.model?.columns.find((c) => c.key === column)?.width)
      this.#emit("pl-column-resize", { column, width: next });
  }

  #onResizeKey(event: KeyboardEvent, column: string, width: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    const step = this.#px(handle, "var(--pl-spacing)");
    // The handle is on the trailing edge: moving it away from the cell widens it.
    const grow = (event.key === "ArrowRight") !== this.matches(":dir(rtl)");
    this.#resize(column, width + (grow ? step : -step), handle);
  }

  #onResizeDown(event: PointerEvent, column: string, width: number) {
    if (event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.#drag = { column, x: event.clientX, width };
  }

  #onResizeMove(event: PointerEvent) {
    const drag = this.#drag;
    if (!drag) return;
    const sign = this.matches(":dir(rtl)") ? -1 : 1;
    this.#resize(
      drag.column,
      drag.width + sign * (event.clientX - drag.x),
      event.currentTarget as HTMLElement,
    );
  }

  #onResizeEnd = () => {
    this.#drag = undefined;
  };

  /** The rows that hold data cells; a group row has none to select. */
  get #dataRows() {
    return this.model?.rows.filter((row) => !row.group) ?? [];
  }

  /** Every cell id in the rectangle between two cells, in row order. */
  #range(from: string, to: string) {
    const rows = this.#dataRows;
    const at = (id: string) => {
      const r = rows.findIndex((row) => row.cells.some((c) => c.id === id));
      return [r, rows[r]?.cells.findIndex((c) => c.id === id) ?? -1] as const;
    };
    const [r1, c1] = at(from);
    const [r2, c2] = at(to);
    if (r1 < 0 || r2 < 0) return [to];
    const ids: string[] = [];
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++)
      for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
        const cell = rows[r]?.cells[c];
        if (cell) ids.push(cell.id);
      }
    return ids;
  }

  #onCellClick(event: MouseEvent, id: string) {
    const td = event.currentTarget as Element;
    if (
      !td.matches("[data-cell]") ||
      (event.target as Element).closest(
        "button, pl-menu, a[href], input, select, textarea, pl-button, pl-checkbox",
      )
    )
      return;
    if (event.shiftKey && this.#anchor)
      this.#emit("pl-cell-select", { cells: this.#range(this.#anchor, id) });
    else {
      this.#anchor = id;
      this.#emit("pl-cell-select", { cells: [id] });
    }
    this.focusCell = id;
  }

  #onCellKey(event: KeyboardEvent, id: string) {
    const td = event.currentTarget as Element;
    if (!td.matches("[data-cell]") || event.target !== td) return;
    const rtl = this.matches(":dir(rtl)");
    const step: Record<string, [number, number]> = {
      ArrowLeft: [rtl ? 1 : -1, 0],
      ArrowRight: [rtl ? -1 : 1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const move = step[event.key];
    if (!move) return;
    event.preventDefault();
    const rows = this.#dataRows;
    const r = rows.findIndex((row) => row.cells.some((c) => c.id === id));
    const c = rows[r]?.cells.findIndex((cell) => cell.id === id) ?? -1;
    const row = rows[Math.min(Math.max(r + move[1], 0), rows.length - 1)];
    const target =
      row?.cells[Math.min(Math.max(c + move[0], 0), row.cells.length - 1)];
    if (!target) return;
    if (event.shiftKey) {
      this.#anchor ??= id;
      this.#emit("pl-cell-select", {
        cells: this.#range(this.#anchor, target.id),
      });
    } else this.#anchor = target.id;
    this.renderRoot
      .querySelector<HTMLElement>(`[data-cell="${CSS.escape(target.id)}"]`)
      ?.focus();
  }

  // A range grows from the cell focus last landed on, so leaving the body forgets it.
  #onBodyFocusOut = (event: FocusEvent) => {
    if (!(event.currentTarget as Element).contains(event.relatedTarget as Node))
      this.#anchor = undefined;
  };

  #columnMenu(
    h: PlModelHeader,
    column: PlModelColumn,
    index: number,
    count: number,
  ) {
    const name = `${this.#text.columnOptions} ${h.label}`.trim();
    return html`<pl-menu
      label=${name}
      @pl-select=${(e: CustomEvent<{ value: string }>) =>
        this.#onColumnMenu(column, index, e)}
    >
      <button
        slot="trigger"
        type="button"
        class="menu-button"
        aria-label=${name}
      >
        ${glyph.more}
      </button>
      ${
        h.sortable
          ? html`<pl-menu-item value="ascending"
                >${this.#text.sortAscending}</pl-menu-item
              >
              <pl-menu-item value="descending"
                >${this.#text.sortDescending}</pl-menu-item
              >
              <pl-menu-separator></pl-menu-separator>`
          : nothing
      }
      ${
        column.canHide
          ? html`<pl-menu-item value="hide">${this.#text.hide}</pl-menu-item>`
          : nothing
      }
      <pl-menu-item value="earlier" ?disabled=${index === 0}
        >${this.#text.moveEarlier}</pl-menu-item
      >
      <pl-menu-item value="later" ?disabled=${index === count - 1}
        >${this.#text.moveLater}</pl-menu-item
      >
      <pl-menu-separator></pl-menu-separator>
      ${
        column.pinned !== "start"
          ? html`<pl-menu-item value="start"
              >${this.#text.pinStart}</pl-menu-item
            >`
          : nothing
      }
      ${
        column.pinned !== "end"
          ? html`<pl-menu-item value="end">${this.#text.pinEnd}</pl-menu-item>`
          : nothing
      }
      ${
        column.pinned
          ? html`<pl-menu-item value="unpin">${this.#text.unpin}</pl-menu-item>`
          : nothing
      }
      <pl-menu-separator></pl-menu-separator>
      <pl-menu-item value="group"
        >${column.grouped ? this.#text.ungroup : this.#text.groupBy}</pl-menu-item
      >
    </pl-menu>`;
  }

  #columnsMenu(model: PlDataTableModel) {
    if (!model.columns.some((c) => c.canHide)) return nothing;
    return html`<pl-menu
      class="columns"
      label=${this.#text.columns}
      @pl-select=${this.#onColumns}
    >
      <pl-button slot="trigger">${this.#text.columns}</pl-button>
      ${model.columns.map(
        (c) =>
          html`<pl-menu-item
            type="checkbox"
            value=${c.key}
            ?checked=${c.visible}
            ?disabled=${!c.canHide}
            >${c.label}</pl-menu-item
          >`,
      )}
    </pl-menu>`;
  }

  #columnFilter(h: PlModelHeader, column: string) {
    const { value, facets = [] } = h.filter!;
    return html`<pl-combobox
      class="column-filter"
      allow-custom
      label=${`${this.#text.filter} ${h.label}`.trim()}
      .value=${value}
      @pl-change=${(e: CustomEvent<{ value: string }>) =>
        this.#onColumnFilter(column, e)}
      @pl-input=${this.#contain}
      @input=${this.#contain}
      @change=${this.#contain}
    >
      ${facets.map((facet) => html`<pl-option>${facet}</pl-option>`)}
    </pl-combobox>`;
  }

  #resizeHandle(label: string, column: string, width: number) {
    return html`<span
      class="resize"
      role="separator"
      aria-orientation="vertical"
      aria-label=${`${this.#text.resize} ${label}`.trim()}
      aria-valuenow=${width}
      tabindex="0"
      @pointerdown=${(e: PointerEvent) => this.#onResizeDown(e, column, width)}
      @pointermove=${(e: PointerEvent) => this.#onResizeMove(e)}
      @pointerup=${this.#onResizeEnd}
      @pointercancel=${this.#onResizeEnd}
      @keydown=${(e: KeyboardEvent) => this.#onResizeKey(e, column, width)}
    ></span>`;
  }

  #rowMenu(row: PlModelRow, label: string) {
    const name = `${this.#text.rowOptions} ${label}`.trim();
    return html`<pl-menu
      class="row-menu"
      label=${name}
      @pl-select=${(e: CustomEvent<{ value: string }>) =>
        this.#onRowMenu(row.id, e)}
    >
      <button
        slot="trigger"
        type="button"
        class="menu-button"
        aria-label=${name}
      >
        ${glyph.more}
      </button>
      ${
        row.pinned !== "top"
          ? html`<pl-menu-item value="top">${this.#text.pinTop}</pl-menu-item>`
          : nothing
      }
      ${
        row.pinned !== "bottom"
          ? html`<pl-menu-item value="bottom"
              >${this.#text.pinBottom}</pl-menu-item
            >`
          : nothing
      }
      ${
        row.pinned
          ? html`<pl-menu-item value="unpin"
              >${this.#text.unpinRow}</pl-menu-item
            >`
          : nothing
      }
    </pl-menu>`;
  }

  #modelHeading(
    h: PlModelHeader,
    offsets: Map<string, number>,
    columns: PlModelColumn[],
  ): ReturnType<typeof html> {
    const span = h.colSpan > 1 ? h.colSpan : undefined;
    const rows = h.rowSpan && h.rowSpan > 1 ? h.rowSpan : undefined;
    const pin = h.pinned;
    const offset = pin ? `--pin: ${offsets.get(h.column ?? "") ?? 0}px` : "";
    if (h.placeholder)
      return html`<td
        class="placeholder"
        colspan=${ifDefined(span)}
        rowspan=${ifDefined(rows)}
        data-pin=${ifDefined(pin)}
        style=${ifDefined(pin ? offset : undefined)}
      ></td>`;
    const column = h.column ?? h.id;
    const model = h.column
      ? columns.find((c) => c.key === h.column)
      : undefined;
    const width = h.width ?? model?.width;
    const resizable = model && (h.resizable ?? model.resizable) && width;
    const label = h.sortable
      ? html`<button
          type="button"
          @click=${() =>
            this.#emit("pl-sort", {
              column,
              direction: h.sort === "ascending" ? "descending" : "ascending",
            })}
        >
          ${h.label}${glyph[h.sort ?? "none"]}
        </button>`
      : h.label;
    return html`<th
      scope=${h.colSpan > 1 ? "colgroup" : "col"}
      colspan=${ifDefined(span)}
      rowspan=${ifDefined(rows)}
      aria-sort=${ifDefined(h.sort)}
      ?data-resizable=${resizable}
      data-pin=${ifDefined(pin)}
      style=${ifDefined(pin ? offset : undefined)}
    >
      ${
        model
          ? html`<div class="head">
              ${label}${this.#columnMenu(h, model, columns.indexOf(model), columns.length)}
            </div>`
          : label
      }
      ${h.filter ? this.#columnFilter(h, column) : nothing}
      ${resizable ? this.#resizeHandle(h.label, column, width!) : nothing}
    </th>`;
  }

  #modelCell(
    cell: PlModelCell,
    offsets: Map<string, number>,
    place?: { row: PlModelRow; first: boolean; indent: boolean },
  ) {
    const pin = cell.pinned;
    const text = String(cell.value ?? "");
    const row = place?.row;
    const lead = place?.first ? place : undefined;
    const label = lead?.row.group ? lead.row.group.value : text;
    const column = this.model?.columns.find((c) => c.key === cell.column);
    const custom =
      row && !row.group && column ? this.renderCell?.(row, column) : undefined;
    const body = lead?.row.group
      ? html`${lead.row.group.value}<span class="count"
            >${lead.row.group.count}</span
          >`
      : (custom ?? text);
    const selectable = this.cellSelect && row && !row.group;
    return html`<td
      colspan=${ifDefined(cell.colSpan && cell.colSpan > 1 ? cell.colSpan : undefined)}
      rowspan=${ifDefined(cell.rowSpan && cell.rowSpan > 1 ? cell.rowSpan : undefined)}
      class=${cell.aggregate ? "aggregate" : ""}
      ?data-selected=${cell.selected}
      data-pin=${ifDefined(pin)}
      data-cell=${ifDefined(selectable ? cell.id : undefined)}
      tabindex=${ifDefined(selectable ? (cell.id === this.#stop ? 0 : -1) : undefined)}
      style=${ifDefined(pin ? `--pin: ${offsets.get(cell.column) ?? 0}px` : undefined)}
      @click=${(e: MouseEvent) => this.#onCellClick(e, cell.id)}
      @keydown=${(e: KeyboardEvent) => this.#onCellKey(e, cell.id)}
      @focus=${() => {
        if (selectable) this.focusCell = cell.id;
      }}
    >
      ${
        lead && row
          ? html`<div class="lead" style="--depth: ${row.depth}">
              ${
                row.expandable
                  ? html`<button
                      type="button"
                      class="expand"
                      aria-expanded=${row.expanded ? "true" : "false"}
                      aria-label=${`${this.#text.expand} ${label}`.trim()}
                      @click=${() =>
                        this.#emit("pl-expand", {
                          row: row.id,
                          expanded: !row.expanded,
                        })}
                    >
                      ${glyph[row.expanded ? "expanded" : "collapsed"]}
                    </button>`
                  : lead?.indent
                    ? html`<span class="expand"></span>`
                    : nothing
              }
              <span>${body}</span>
              ${this.rowMenu && !row.group ? this.#rowMenu(row, label) : nothing}
            </div>`
          : body
      }
    </td>`;
  }

  #renderModel(model: PlDataTableModel) {
    const offsets = this.#offsets(model.columns);
    const shown = model.columns.filter((c) => c.visible);
    const indent = model.rows.some((r) => r.expandable);
    const total = shown.reduce((sum, c) => sum + (c.width ?? 0), 0);
    const ids = this.#dataRows.flatMap((r) => r.cells.map((c) => c.id));
    this.#stop =
      this.focusCell && ids.includes(this.focusCell) ? this.focusCell : ids[0];
    const field = this.#filterField(model.filter ?? "");
    const columns = this.#columnsMenu(model);
    return html`${
        field === nothing && columns === nothing
          ? nothing
          : html`<div class="toolbar">${field}${columns}</div>`
      }<pl-table ?sticky-header=${this.stickyHeader}>
        <table
          class="model"
          style=${ifDefined(total ? `min-inline-size: ${total}px` : undefined)}
        >
          ${
            this.caption
              ? html`<caption>
                  ${this.caption}
                </caption>`
              : nothing
          }
          <colgroup>
            ${shown.map(
              (c) =>
                html`<col
                  style=${ifDefined(c.width ? `inline-size: ${c.width}px` : undefined)}
                />`,
            )}
          </colgroup>
          <thead>
            ${model.headerGroups.map(
              (group) =>
                html`<tr>
                  ${group.map((h) => this.#modelHeading(h, offsets, model.columns))}
                </tr>`,
            )}
          </thead>
          <tbody @focusout=${this.#onBodyFocusOut}>
            ${
              model.rows.length
                ? repeat(
                    model.rows,
                    (row) => row.id,
                    (row) =>
                      html`<tr
                        class=${row.group ? "group" : ""}
                        data-row-pin=${ifDefined(row.pinned)}
                        ?data-selected=${row.selected}
                      >
                        ${row.cells.map((cell, i) =>
                          this.#modelCell(cell, offsets, {
                            row,
                            first: i === 0,
                            indent,
                          }),
                        )}
                      </tr>`,
                  )
                : html`<tr>
                    <td class="empty" colspan=${shown.length || 1}>
                      <slot name="empty">${this.#text.noResults}</slot>
                    </td>
                  </tr>`
            }
          </tbody>
          ${
            model.footer
              ? html`<tfoot>
                  <tr>
                    ${model.footer.map((cell) => this.#modelCell(cell, offsets))}
                  </tr>
                </tfoot>`
              : nothing
          }
        </table> </pl-table
      >${model.page ? this.#pager(model.page.page, model.page.total) : nothing}`;
  }

  override render() {
    if (this.model) return this.#renderModel(this.model);
    const view = this.#view;
    const shown = this.manualPagination
      ? view
      : pageRows(view, this.page, this.pageSize);
    const chosen = new Set(this.selected);
    const picked = view.filter((v) => chosen.has(v.key)).length;
    const first = this.columns[0]?.key;
    const span = this.columns.length + (this.selectable ? 1 : 0);
    return html`${this.#filterField(this.filter)}<pl-table
        ?sticky-header=${this.stickyHeader}
      >
        <table>
          ${
            this.caption
              ? html`<caption>
                  ${this.caption}
                </caption>`
              : nothing
          }
          <thead>
            <tr>
              ${
                this.selectable
                  ? html`<th scope="col" class="select">
                      <pl-checkbox
                        aria-label=${this.#text.selectAll}
                        .checked=${view.length > 0 && picked === view.length}
                        .indeterminate=${picked > 0 && picked < view.length}
                        ?disabled=${view.length === 0}
                        @pl-change=${this.#onAll}
                        @input=${this.#contain}
                      ></pl-checkbox>
                    </th>`
                  : nothing
              }
              ${this.columns.map((column) => this.#heading(column))}
            </tr>
          </thead>
          <tbody>
            ${
              shown.length
                ? repeat(
                    shown,
                    (v) => v.key,
                    ({ row, key }) =>
                      html`<tr ?data-selected=${chosen.has(key)}>
                        ${
                          this.selectable
                            ? html`<td class="select">
                                <pl-checkbox
                                  aria-label=${`${this.#text.select} ${first ? String(row[first] ?? "") : key}`.trim()}
                                  .checked=${chosen.has(key)}
                                  @pl-change=${(
                                    e: CustomEvent<{ checked: boolean }>,
                                  ) => this.#onRow(key, e)}
                                  @input=${this.#contain}
                                ></pl-checkbox>
                              </td>`
                            : nothing
                        }
                        ${this.columns.map(
                          (column) =>
                            html`<td align=${ifDefined(column.align)}>
                              ${this.renderCell?.(row, column) ?? String(row[column.key] ?? "")}
                            </td>`,
                        )}
                      </tr>`,
                  )
                : html`<tr>
                    <td class="empty" colspan=${span}>
                      <slot name="empty">${this.#text.noResults}</slot>
                    </td>
                  </tr>`
            }
          </tbody>
        </table> </pl-table
      >${
        this.pageSize > 0
          ? this.#pager(this.page, this.#pages(view.length))
          : nothing
      }`;
  }
}

customElements.define("pl-data-table", PlDataTable);

declare global {
  interface HTMLElementTagNameMap {
    "pl-data-table": PlDataTable;
  }
}
