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
 * by the sidebar because level 2 items follow it, a disclosure button. Without
 * an `href` it renders a plain button, so an app can handle the click itself.
 *
 * @slot - The item label.
 * @slot icon - A leading svg icon, tinted with the accent text color.
 * @slot detail - Trailing muted text, such as a count.
 * @csspart control - The link or disclosure button.
 * @csspart chevron - The disclosure arrow.
 * @fires purr-toggle - A disclosure button opened or closed. `detail.expanded` holds the new state.
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
  };

  declare href: string | undefined;
  declare selected: boolean;
  /** Set by the sidebar when level 2 items follow this one. */
  declare expandable: boolean;
  declare expanded: boolean;

  #level: SidebarLevel = 1;

  constructor() {
    super();
    this.selected = false;
    this.expandable = false;
    this.expanded = false;
  }

  /** 1 or 2. Any other value throws in development. */
  get level(): SidebarLevel {
    return this.#level;
  }

  set level(value: SidebarLevel) {
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

  override render() {
    return this.expandable
      ? html`<button
          class="control"
          part="control"
          type="button"
          aria-expanded=${this.expanded ? "true" : "false"}
          @click=${this.#toggle}
        >
          ${chevron}${icon}${label}${detail}
        </button>`
      : this.href
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
