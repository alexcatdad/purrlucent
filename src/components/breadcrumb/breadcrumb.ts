import { LensController } from "../../behaviors/lens.ts";
import { LitElement, html, nothing, svg, type PropertyValues } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { breadcrumbItemStyles, breadcrumbStyles } from "./breadcrumb.css.ts";
import { messages } from "../../behaviors/locale.ts";

const chevron = svg`<svg part="separator" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6 6.5-6 6.5" /></svg>`;

/**
 * One step of the trail. With an `href` it is a link; without, it is plain
 * text. The parent `pl-breadcrumb` marks the last one `current`. A name wider
 * than the room ends in an ellipsis and its full text becomes the title.
 *
 * @slot - The name of the step.
 * @csspart link - The link, or the text of a step with no `href`.
 * @csspart separator - The decorative chevron after the step.
 */
export class PlBreadcrumbItem extends LitElement {
  static override styles = breadcrumbItemStyles;
  static override properties = {
    href: { type: String },
    target: { type: String },
    rel: { type: String },
    current: { type: Boolean, reflect: true },
    _full: { state: true },
  };

  /** Where the step leads. Without it the step is text. */
  declare href: string | undefined;
  /** Where to open the link, such as `_blank`. */
  declare target: string | undefined;
  /** The link relationship. */
  declare rel: string | undefined;
  /** The page the trail ends on. Set by `pl-breadcrumb` on the last step. */
  declare current: boolean;
  declare _full: string | undefined;

  readonly #resize = new ResizeObserver(() => this.#measure());

  constructor() {
    super();
    this.current = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "listitem");
    this.#resize.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
  }

  // The full text is offered only while the name is cut off.
  #measure() {
    const link = this.renderRoot.querySelector<HTMLElement>('[part="link"]');
    this._full =
      link && link.scrollWidth > link.clientWidth
        ? this.textContent.trim()
        : undefined;
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.size) this.#measure();
  }

  override render() {
    const current = this.current ? "page" : undefined;
    const slot = html`<slot @slotchange=${() => this.#measure()}></slot>`;
    return html`${
      this.href
        ? html`<a
            part="link"
            href=${this.href}
            target=${ifDefined(this.target)}
            rel=${ifDefined(this.rel)}
            title=${ifDefined(this._full)}
            aria-current=${ifDefined(current)}
            >${slot}</a
          >`
        : html`<span
            part="link"
            title=${ifDefined(this._full)}
            aria-current=${ifDefined(current)}
            >${slot}</span
          >`
    }${this.current ? nothing : chevron}`;
  }
}

customElements.define("pl-breadcrumb-item", PlBreadcrumbItem);

/**
 * The path to the current page: a navigation landmark holding an ordered list
 * of `pl-breadcrumb-item`s. The last item is the current page and carries
 * `aria-current="page"`. The chevrons between items are decorative and hidden
 * from assistive technology. Long trails shrink their items to ellipses, each
 * offering its full text.
 *
 * Put it in the window body, not in a toolbar or status bar.
 *
 * @slot - The `pl-breadcrumb-item`s, the root first and the current page last.
 * @csspart list - The ordered list.
 */
export class PlBreadcrumb extends LitElement {
  static override styles = breadcrumbStyles;
  static override properties = { label: { type: String } };

  /** Accessible name of the landmark. Defaults to the page language's text (see `setMessages`), in English "Breadcrumb". */
  declare label: string;

  constructor() {
    super();
    new LensController(this);
    this.label = "";
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "navigation");
  }

  protected override willUpdate() {
    // Every update, so the built-in name follows a change of language.
    this.setAttribute("aria-label", this.label || messages(this).breadcrumb);
  }

  #onSlotChange(event: Event) {
    const items = (event.target as HTMLSlotElement)
      .assignedElements({ flatten: true })
      .filter((el): el is PlBreadcrumbItem => el instanceof PlBreadcrumbItem);
    items.forEach((item, i) => (item.current = i === items.length - 1));
  }

  override render() {
    return html`<ol part="list" role="list">
      <slot @slotchange=${this.#onSlotChange}></slot>
    </ol>`;
  }
}

customElements.define("pl-breadcrumb", PlBreadcrumb);

declare global {
  interface HTMLElementTagNameMap {
    "pl-breadcrumb": PlBreadcrumb;
    "pl-breadcrumb-item": PlBreadcrumbItem;
  }
}
