import { LitElement, html, nothing, svg } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import "../checkbox/checkbox.ts";
import "../input/input.ts";
import "../pagination/pagination.ts";
import { clampPage } from "../pagination/pages.ts";
import "../table/table.ts";
import { dataTableStyles } from "./data-table.css.ts";
import { filterRows, pageCount, pageRows } from "./data-table-model.ts";

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
export type PlSortDirection = "ascending" | "descending";

const glyph = {
  ascending: svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>`,
  descending: svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>`,
  none: svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></svg>`,
};

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
 * @attr {string} caption - A visible caption that also names the table.
 * @attr {boolean} sticky-header - The headings stay at the top while the rows scroll; give the element a `max-block-size`.
 * @attr {boolean} selectable - Adds a checkbox column.
 * @attr {string} row-key - The row property that identifies a row in `selected` and `pl-selection-change`. Defaults to `id`; a row without it is identified by its index.
 * @attr {string} sort-column - The `key` of the sorted column.
 * @attr {string} sort-direction - `ascending` (default) or `descending`.
 * @attr {boolean} manual-sort - Do not reorder the rows; the app does it on `pl-sort`.
 * @attr {boolean} filterable - Shows a search field above the table.
 * @attr {string} filter-label - The search field's accessible name. Defaults to "Filter".
 * @attr {string} filter - The global filter query.
 * @attr {boolean} manual-filter - Do not filter the rows; the app does it on `pl-filter`.
 * @attr {number} page-size - Rows per page; 0 (default) shows every row and no pagination.
 * @attr {number} page - The current page, from 1. Defaults to 1; a page past the end is clamped.
 * @attr {boolean} manual-pagination - Do not slice the rows; the app does it on `pl-page`. `row-count` then gives the total.
 * @attr {number} row-count - With `manual-pagination`, the number of rows over all pages. Defaults to the number of rows given.
 * @attr {string} empty-label - The text shown when there are no rows and the `empty` slot is unused. Defaults to "No results".
 * @attr {string} select-all-label - The select-all checkbox's accessible name. Defaults to "Select all".
 * @attr {string} select-row-label - Prefix of each row checkbox's accessible name, followed by the row's first cell. Defaults to "Select".
 * @slot empty - Content shown instead of the rows when there are none.
 * @fires {CustomEvent<{ column: string, direction: "ascending" | "descending" }>} pl-sort - A heading was activated. `detail.column` is the column key and `detail.direction` the new direction.
 * @fires {CustomEvent<{ keys: string[] }>} pl-selection-change - The selection changed through a checkbox. `detail.keys` holds the selected row keys, in row order.
 * @fires {CustomEvent<{ value: string }>} pl-filter - The filter field changed. `detail.value` is the query.
 * @fires {CustomEvent<{ page: number }>} pl-page - Another page was chosen. `detail.page` is the page.
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
    this.filterLabel = "Filter";
    this.filter = "";
    this.manualFilter = false;
    this.pageSize = 0;
    this.page = 1;
    this.manualPagination = false;
    this.emptyLabel = "No results";
    this.selectAllLabel = "Select all";
    this.selectRowLabel = "Select";
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

  protected override willUpdate() {
    // A filter that leaves fewer rows than the page needs moves to the last page.
    if (this.pageSize > 0)
      this.page = clampPage(this.page, this.#pages(this.#view.length));
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
    this.filter = event.detail.value;
    this.#emit("pl-filter", { value: this.filter });
    this.#goto(1);
  };

  #onPage = (event: CustomEvent<{ page: number }>) => {
    event.stopPropagation();
    this.#goto(event.detail.page);
  };

  #goto(page: number) {
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

  override render() {
    const view = this.#view;
    const shown = this.manualPagination
      ? view
      : pageRows(view, this.page, this.pageSize);
    const chosen = new Set(this.selected);
    const picked = view.filter((v) => chosen.has(v.key)).length;
    const first = this.columns[0]?.key;
    const span = this.columns.length + (this.selectable ? 1 : 0);
    return html`${
        this.filterable
          ? html`<pl-input
              type="search"
              class="filter"
              label=${this.filterLabel}
              .value=${this.filter}
              @pl-input=${this.#onFilter}
              @pl-change=${this.#contain}
              @input=${this.#contain}
              @change=${this.#contain}
            ></pl-input>`
          : nothing
      }<pl-table ?sticky-header=${this.stickyHeader}>
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
                        aria-label=${this.selectAllLabel}
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
                                  aria-label=${`${this.selectRowLabel ?? ""} ${first ? String(row[first] ?? "") : key}`.trim()}
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
                              ${String(row[column.key] ?? "")}
                            </td>`,
                        )}
                      </tr>`,
                  )
                : html`<tr>
                    <td class="empty" colspan=${span}>
                      <slot name="empty">${this.emptyLabel}</slot>
                    </td>
                  </tr>`
            }
          </tbody>
        </table> </pl-table
      >${
        this.pageSize > 0
          ? html`<pl-pagination
              class="pages"
              .page=${this.page}
              .total=${this.#pages(view.length)}
              @pl-change=${this.#onPage}
              @input=${this.#contain}
              @change=${this.#contain}
            ></pl-pagination>`
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
