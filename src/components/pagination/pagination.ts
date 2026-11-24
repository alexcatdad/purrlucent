import { LitElement, html, nothing, svg, type PropertyValues } from "lit";
import { fireNative } from "../../behaviors/native-events.ts";
import { paginationStyles } from "./pagination.css.ts";
import { clampPage, pageItems, wholeTotal } from "./pages.ts";
import { messages } from "../../behaviors/locale.ts";

// Both point toward their own side; the stylesheet mirrors them under right-to-left.
const previousGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14.5 5.5-6 6.5 6 6.5" /></svg>`;
const nextGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6 6.5-6 6.5" /></svg>`;

type Kind = "previous" | "next" | "page";

/**
 * Previous and next buttons and numbered pages for moving through an ordered
 * list of pages. The first and last page always show; pages in between give
 * way to an ellipsis, so a long range stays seven items wide. The current page
 * is marked `aria-current="page"` and filled.
 *
 * The host is a `navigation` landmark named by `label`; give each pagination
 * on a page its own `label`. Without `href-template` the items are buttons
 * and the app reacts to `pl-change`. With it they are links, so each page has
 * an address; `pl-change` still fires on a plain click, and a click with a
 * modifier key (open in a new tab) changes nothing. At the first page Previous
 * is disabled, and at the last page Next is.
 *
 * Use it only for pages in a sequence. For a few peer views use
 * `pl-toggle-group`; for a large hierarchy use `pl-sidebar`.
 *
 * @attr {number} page - The current page, from 1 to `total`. Defaults to 1; a value out of range is clamped.
 * @attr {number} total - The number of pages. Defaults to 1.
 * @attr {string} label - The accessible name of the landmark. Defaults to the page language's text (see `setMessages`), in English "Pagination".
 * @attr {string} href-template - Makes the pages links. `{page}` is replaced by the page number, as in `/posts?page={page}`.
 * @attr {string} previous-label - The accessible name of the Previous button. Defaults to the page language's text (see `setMessages`), in English "Previous page".
 * @attr {string} next-label - The accessible name of the Next button. Defaults to the page language's text (see `setMessages`), in English "Next page".
 * @fires {CustomEvent<{ page: number }>} pl-change - The user chose another page. `detail.page` holds it.
 * @fires input - After pl-change, as a native control fires it.
 * @fires change - After input, as a native control fires it.
 * @csspart list - The list of items.
 * @csspart previous - The Previous button or link.
 * @csspart next - The Next button or link.
 * @csspart page - A page button or link.
 * @csspart current - The current page, besides `page`.
 * @csspart gap - An ellipsis.
 */
export class PlPagination extends LitElement {
  static override styles = paginationStyles;
  static override properties = {
    page: { type: Number, reflect: true },
    total: { type: Number, reflect: true },
    label: { type: String },
    hrefTemplate: { attribute: "href-template" },
    previousLabel: { attribute: "previous-label" },
    nextLabel: { attribute: "next-label" },
  };

  declare page: number;
  declare total: number;
  declare label: string;
  declare hrefTemplate: string;
  declare previousLabel: string;
  declare nextLabel: string;

  constructor() {
    super();
    this.page = 1;
    this.total = 1;
    this.label = "";
    this.hrefTemplate = "";
    this.previousLabel = "";
    this.nextLabel = "";
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "navigation");
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    this.total = wholeTotal(this.total);
    this.page = clampPage(this.page, this.total);
    if (changed.has("label")) {
      this.setAttribute("aria-label", this.label || messages(this).pagination);
    }
  }

  #href(page: number) {
    return this.hrefTemplate.replaceAll("{page}", String(page));
  }

  /** The user's choice; the native events follow pl-change, as on a native control. */
  async #go(page: number, kind: Kind, event: MouseEvent) {
    // Ctrl, Command and Shift open a link elsewhere; the page here stays.
    if (
      this.hrefTemplate &&
      (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
    )
      return;
    if (page === this.page) return;
    const focused = this.renderRoot.querySelector(":focus") !== null;
    this.page = page;
    this.dispatchEvent(
      new CustomEvent("pl-change", {
        detail: { page },
        bubbles: true,
        composed: true,
      }),
    );
    fireNative(this, "input", "change");
    await this.updateComplete;
    // The control that had focus may now be disabled, or stand for another page.
    if (!focused) return;
    const root = this.renderRoot;
    (
      (kind === "page"
        ? null
        : root.querySelector<HTMLElement>(
            `[part~="${kind}"]:not(:disabled):not([aria-disabled="true"])`,
          )) ?? root.querySelector<HTMLElement>('[aria-current="page"]')
    )?.focus();
  }

  #control(
    kind: Kind,
    page: number,
    content: unknown,
    name: string | undefined,
    off = false,
    current = false,
  ) {
    const part = current ? "page current" : kind;
    const aria = current ? "page" : nothing;
    const label = name ?? nothing;
    if (this.hrefTemplate)
      return off
        ? // An anchor without an href is not focusable: a disabled link.
          html`<a
            class="control"
            part=${part}
            role="link"
            aria-disabled="true"
            aria-label=${label}
            >${content}</a
          >`
        : html`<a
            class="control"
            part=${part}
            href=${this.#href(page)}
            aria-current=${aria}
            aria-label=${label}
            @click=${(e: MouseEvent) => this.#go(page, kind, e)}
            >${content}</a
          >`;
    return html`<button
      class="control"
      part=${part}
      type="button"
      ?disabled=${off}
      aria-current=${aria}
      aria-label=${label}
      @click=${(e: MouseEvent) => this.#go(page, kind, e)}
    >
      ${content}
    </button>`;
  }

  override render() {
    const { page, total } = this;
    return html`<ul part="list" role="list">
      <li>
        ${this.#control(
          "previous",
          page - 1,
          previousGlyph,
          this.previousLabel || messages(this).previousPage,
          page <= 1,
        )}
      </li>
      ${pageItems(page, total).map((item) =>
        item === "gap"
          ? html`<li class="gap" part="gap" aria-hidden="true">…</li>`
          : html`<li>
              ${this.#control(
                "page",
                item,
                String(item),
                undefined,
                false,
                item === page,
              )}
            </li>`,
      )}
      <li>
        ${this.#control(
          "next",
          page + 1,
          nextGlyph,
          this.nextLabel || messages(this).nextPage,
          page >= total,
        )}
      </li>
    </ul>`;
  }
}

customElements.define("pl-pagination", PlPagination);

declare global {
  interface HTMLElementTagNameMap {
    "pl-pagination": PlPagination;
  }
}
