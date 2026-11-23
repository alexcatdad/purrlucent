import { LitElement, html, nothing, svg } from "lit";
import { parseLevel, type SidebarLevel } from "./level.ts";
import { itemStyles } from "./sidebar.css.ts";

// design/icons/chevron-right.svg
const chevron = svg`<svg class="chevron" part="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.25 5.75 5.5 5.5q.75.75 0 1.5l-5.5 5.5" /></svg>`;

// Leaves leave the chevron slot empty, so every level 1 label shares one edge.
const label = html`<span class="label"><slot></slot></span>`;
const icon = html`<slot name="icon"></slot>`;
const detail = html`<slot name="detail"></slot>`;

/**
 * One entry of a `purr-sidebar`. It renders a link, or, when `expandable` is set
 * by the sidebar because level 2 items follow it, a disclosure button. An
 * expandable item with an `href` keeps its link, which selects like any other,
 * and gets a separate disclosure button before it. Without an `href` an item
 * renders a plain button; clicking it selects it, so an app can also handle the
 * click itself.
 *
 * @attr {string} toggle-label - The disclosure button's accessible name when a link has one beside it. Defaults to "<item label>, show items".
 * @slot - The item label.
 * @slot icon - A leading svg icon, tinted with the accent text color.
 * @slot detail - Trailing muted text, such as a count.
 * @csspart control - The link or disclosure button.
 * @csspart disclosure - The disclosure button beside a link.
 * @csspart chevron - The disclosure arrow.
 * @fires {CustomEvent<{ expanded: boolean }>} purr-toggle - A disclosure button opened or closed. `detail.expanded` holds the new state.
 */
export class PurrSidebarItem extends LitElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = itemStyles;
  static override properties = {
    href: { type: String, reflect: true },
    selected: { type: Boolean, reflect: true },
    level: { type: Number, reflect: true, noAccessor: true },
    expandable: { type: Boolean, reflect: true },
    expanded: { type: Boolean, reflect: true },
    toggleLabel: { attribute: "toggle-label" },
  };

  declare href: string | undefined;
  declare selected: boolean;
  /** Set by the sidebar when level 2 items follow this one. */
  declare expandable: boolean;
  declare expanded: boolean;
  declare toggleLabel: string;

  #level: SidebarLevel = 1;

  constructor() {
    super();
    this.selected = false;
    this.expandable = false;
    this.expanded = false;
    this.toggleLabel = "";
  }

  /** 1 or 2. Any other value throws in development. */
  get level(): SidebarLevel {
    return this.#level;
  }

  set level(value: SidebarLevel | null | undefined) {
    const old = this.#level;
    this.#level = parseLevel(value);
    this.requestUpdate("level", old);
  }

  #toggle = () => {
    this.expanded = !this.expanded;
    this.dispatchEvent(
      new CustomEvent("purr-toggle", {
        detail: { expanded: this.expanded },
        bubbles: true,
        composed: true,
      }),
    );
  };

  /** The level 2 items that follow this one. */
  #children() {
    const children: Element[] = [];
    for (
      let next = this.nextElementSibling;
      next instanceof PurrSidebarItem && next.level === 2;
      next = next.nextElementSibling
    )
      children.push(next);
    return children;
  }

  /** The disclosure button's name: `toggle-label`, else "<label>, show items". */
  #name() {
    if (this.toggleLabel) return this.toggleLabel;
    const text = [...this.childNodes]
      .filter((node) =>
        node instanceof Element ? !node.slot : node.nodeType === Node.TEXT_NODE,
      )
      .map((node) => node.textContent)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    return `${text}, show items`;
  }

  protected override updated() {
    // The controlled items sit in the light DOM, out of reach of an id reference.
    const button = this.renderRoot.querySelector<
      HTMLButtonElement & { ariaControlsElements?: Element[] | null }
    >(".disclosure");
    if (button && "ariaControlsElements" in button)
      button.ariaControlsElements = this.#children();
  }

  override render() {
    if (this.expandable && this.href)
      // A destination and a disclosure: two controls, the button first.
      return html`<button
          class="disclosure"
          part="disclosure"
          type="button"
          aria-expanded=${this.expanded ? "true" : "false"}
          aria-label=${this.#name()}
          @click=${this.#toggle}
        >
          ${chevron}</button
        ><a
          class="control"
          part="control"
          href=${this.href}
          aria-current=${this.selected ? "page" : nothing}
          @slotchange=${() => this.requestUpdate()}
          >${icon}${label}${detail}</a
        >`;
    if (this.expandable)
      return html`<button
        class="control"
        part="control"
        type="button"
        aria-expanded=${this.expanded ? "true" : "false"}
        @click=${this.#toggle}
      >
        ${chevron}${icon}${label}${detail}
      </button>`;
    return this.href
      ? html`<a
          class="control"
          part="control"
          href=${this.href}
          aria-current=${this.selected ? "page" : nothing}
          >${icon}${label}${detail}</a
        >`
      : // Without a destination an anchor is not focusable, so use a button.
        html`<button
          class="control"
          part="control"
          type="button"
          aria-current=${this.selected ? "page" : nothing}
        >
          ${icon}${label}${detail}
        </button>`;
  }
}

customElements.define("purr-sidebar-item", PurrSidebarItem);

declare global {
  interface HTMLElementTagNameMap {
    "purr-sidebar-item": PurrSidebarItem;
  }
}
