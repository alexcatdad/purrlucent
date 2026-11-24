import { LitElement, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { tableDocumentStyles, tableStyles } from "./table.css.ts";

/** Adopts the table rules once into the root that holds the element. */
function adoptTableStyles(root: Node) {
  const sheet = tableDocumentStyles.styleSheet;
  if (!sheet || !(root instanceof Document || root instanceof ShadowRoot))
    return;
  if (!root.adoptedStyleSheets.includes(sheet))
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
}

/**
 * Styles a native table. Slot one `<table>` (with `<caption>`, `<thead>`,
 * `<tbody>`, `<th scope>`) and it keeps its table semantics: a custom element
 * cannot sit inside `<table>`, so this one wraps it instead of replacing it.
 * The rules are adopted as a stylesheet into the root the element is in. The
 * wrapper scrolls when the table is wider or taller than the space it gets,
 * and then takes a tab stop so the keyboard can scroll it. It is named by
 * `label`, or else by the table's caption; without either, the scroll area
 * has no accessible name. Set a `max-block-size` on the element to make
 * `sticky-header` useful. A static table is not a grid: do not add `role=grid`.
 * A row with `data-interactive`, or one holding an `a[data-stretched]` link
 * that covers the row, gets a hover tint, a focus ring and a pointer. Prefer
 * the stretched link: other controls in that row need `position: relative` and
 * `z-index: 1` to stay above its overlay. The page owns the role and the
 * Enter/Space handling of a focusable `data-interactive` row. A
 * `<th aria-sort>` holding a `<button>` is styled as a sort control, with a
 * glyph that follows `aria-sort`; the page owns the sorting. A row with
 * `aria-selected="true"` or `data-selected` gets the selection tint. A `td` or
 * `th` with `align="end"` or `data-numeric` is right-aligned with tabular
 * figures. A plain link in a cell takes the accent colour, is semibold and
 * underlines on hover; an `a[data-stretched]` link keeps the row behaviour.
 *
 * @attr {string} label - The accessible name of the scroll area. Defaults to the table's caption.
 * @attr {boolean} striped - Even body rows get a faint alternate fill; hover and selection override it.
 * @attr {"regular" | "compact"} density - Row height and cell padding. Unset, it follows the page's `data-pl-density`.
 * @attr {boolean} sticky-header - The header cells stay at the top while the rows scroll.
 * @slot - A native `<table>`.
 * @csspart scroller - The scroll container.
 */
export class PlTable extends LitElement {
  static override styles = tableStyles;
  static override properties = {
    label: {},
    striped: { type: Boolean, reflect: true },
    density: { reflect: true },
    stickyHeader: { type: Boolean, reflect: true, attribute: "sticky-header" },
    _scrollable: { state: true },
    _caption: { state: true },
  };

  declare label: string | undefined;
  declare striped: boolean;
  declare density: "regular" | "compact" | undefined;
  declare stickyHeader: boolean;
  declare _scrollable: boolean;
  declare _caption: string;

  readonly #resize = new ResizeObserver(() => this.#measure());
  readonly #mutation = new MutationObserver(() => this.#measure());

  constructor() {
    super();
    this.striped = false;
    this.stickyHeader = false;
    this._scrollable = false;
    this._caption = "";
  }

  get #scroller() {
    return this.renderRoot?.querySelector<HTMLElement>("[part=scroller]");
  }

  override connectedCallback() {
    super.connectedCallback();
    adoptTableStyles(this.getRootNode());
    // A caption edited later renames the scroll area.
    this.#mutation.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    // A move keeps the element but not its observers; firstUpdated only runs once.
    if (this.hasUpdated) this.#observe();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
    this.#mutation.disconnect();
  }

  protected override firstUpdated() {
    this.#observe();
  }

  #observe() {
    this.#resize.disconnect();
    const scroller = this.#scroller;
    if (scroller) this.#resize.observe(scroller);
    for (const el of this.querySelectorAll(":scope > table"))
      this.#resize.observe(el);
    this.#measure();
  }

  #measure() {
    const scroller = this.#scroller;
    if (!scroller) return;
    this._scrollable =
      scroller.scrollWidth > scroller.clientWidth ||
      scroller.scrollHeight > scroller.clientHeight;
    this._caption =
      this.querySelector(":scope > table > caption")?.textContent?.trim() ?? "";
  }

  override render() {
    const name = this.label || this._caption;
    const region = this._scrollable && name;
    return html`<div
      part="scroller"
      role=${ifDefined(region ? "region" : undefined)}
      aria-label=${ifDefined(region ? name : undefined)}
      tabindex=${ifDefined(this._scrollable ? 0 : undefined)}
    >
      <slot @slotchange=${() => this.#observe()}></slot>
    </div>`;
  }
}

customElements.define("pl-table", PlTable);

declare global {
  interface HTMLElementTagNameMap {
    "pl-table": PlTable;
  }
}
