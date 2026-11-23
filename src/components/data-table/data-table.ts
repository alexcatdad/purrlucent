import { LitElement, html, nothing, svg } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import "../checkbox/checkbox.ts";
import "../table/table.ts";
import { dataTableStyles } from "./data-table.css.ts";

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
 * is rendered; there is no virtualization. With no rows, the `empty` slot (or
 * `empty-label`) shows in place of the body.
 *
 * @attr {string} caption - A visible caption that also names the table.
 * @attr {boolean} sticky-header - The headings stay at the top while the rows scroll; give the element a `max-block-size`.
 * @attr {boolean} selectable - Adds a checkbox column.
 * @attr {string} row-key - The row property that identifies a row in `selected` and `pl-selection-change`. Defaults to `id`; a row without it is identified by its index.
 * @attr {string} sort-column - The `key` of the sorted column.
 * @attr {string} sort-direction - `ascending` (default) or `descending`.
 * @attr {boolean} manual-sort - Do not reorder the rows; the app does it on `pl-sort`.
 * @attr {string} empty-label - The text shown when there are no rows and the `empty` slot is unused. Defaults to "No results".
 * @attr {string} select-all-label - The select-all checkbox's accessible name. Defaults to "Select all".
 * @attr {string} select-row-label - Prefix of each row checkbox's accessible name, followed by the row's first cell. Defaults to "Select".
 * @slot empty - Content shown instead of the rows when there are none.
 * @fires {CustomEvent<{ column: string, direction: "ascending" | "descending" }>} pl-sort - A heading was activated. `detail.column` is the column key and `detail.direction` the new direction.
 * @fires {CustomEvent<{ keys: string[] }>} pl-selection-change - The selection changed through a checkbox. `detail.keys` holds the selected row keys, in row order.
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
    this.emptyLabel = "No results";
    this.selectAllLabel = "Select all";
    this.selectRowLabel = "Select";
  }

  #key(row: PlDataTableRow, index: number) {
    return String(row[this.rowKey] ?? index);
  }

  /** The rows in display order, each with its key. */
  get #view() {
    const view = this.rows.map((row, index) => ({
      row,
      key: this.#key(row, index),
    }));
    if (this.manualSort || !this.sortColumn) return view;
    const column = this.sortColumn;
    const sign = this.sortDirection === "descending" ? -1 : 1;
    return view.sort((a, b) => sign * compare(a.row[column], b.row[column]));
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
    this.selected = this.#view.map((v) => v.key).filter((k) => keys.has(k));
    this.#emit("pl-selection-change", { keys: [...this.selected] });
  }

  // The checkbox's own events would reach the app as if the table were one.
  #contain(event: Event) {
    event.stopPropagation();
  }

  #onAll = (event: CustomEvent<{ checked: boolean }>) => {
    event.stopPropagation();
    this.#select(
      new Set(event.detail.checked ? this.#view.map((v) => v.key) : []),
    );
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
    const chosen = new Set(this.selected);
    const picked = view.filter((v) => chosen.has(v.key)).length;
    const first = this.columns[0]?.key;
    const span = this.columns.length + (this.selectable ? 1 : 0);
    return html`<pl-table ?sticky-header=${this.stickyHeader}>
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
            view.length
              ? repeat(
                  view,
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
      </table>
    </pl-table>`;
  }
}

customElements.define("pl-data-table", PlDataTable);

declare global {
  interface HTMLElementTagNameMap {
    "pl-data-table": PlDataTable;
  }
}
