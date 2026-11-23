import { LitElement, html, nothing, svg, type PropertyValues } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { AnchoredController } from "../../behaviors/anchored.ts";
import { DismissController } from "../../behaviors/dismiss.ts";
import { barSurface } from "../../surfaces/surfaces.css.ts";
import { itemStyles, navigationMenuStyles } from "./navigation-menu.css.ts";

// design/icons/chevron-down.svg
const chevron = svg`<svg part="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5.75 9.25 5.5 5.5q.75.75 1.5 0l5.5-5.5" /></svg>`;

/**
 * One entry of a `pl-navigation-menu`. With an `href` it is a link. With
 * children in the `panel` slot (usually `<a slot="panel">` links) it is a
 * disclosure button that shows and hides a panel of those links, per the
 * disclosure navigation pattern: it is not an ARIA menu, so the links are
 * reached with Tab and the arrow keys are not used. Escape closes the panel and
 * returns focus to the button, as does a press outside it; Tab out of the
 * panel closes it. A panel opens below the button, flips above it when there is
 * no room, and never goes beyond the viewport.
 *
 * @attr {string} href - The destination of a link item. Ignored when the item has a panel.
 * @attr {boolean} current - This item is, or holds, the current page: `aria-current="page"` on a link, `"true"` on a disclosure button. Mark a panel link yourself with `aria-current="page"`.
 * @attr {boolean} open - The panel is showing. Opening it closes the other panels in the same menu.
 * @slot - The item label.
 * @slot panel - The links of the panel. Giving the item any makes it a disclosure button.
 * @csspart control - The link or the disclosure button.
 * @csspart label - The label wrapper.
 * @csspart chevron - The disclosure arrow.
 * @csspart panel - The floating panel of links.
 * @fires {CustomEvent<{ open: boolean }>} pl-toggle - The panel opened or closed. `detail.open` says which.
 */
export class PlNavigationItem extends LitElement {
  static override styles = itemStyles;
  static override properties = {
    href: { reflect: true },
    current: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
  };

  declare href: string | undefined;
  declare current: boolean;
  declare open: boolean;

  constructor() {
    super();
    this.current = false;
    this.open = false;
    new DismissController(this, {
      enabled: () => this.open,
      onDismiss: (reason) => this.#close(reason === "escape"),
    });
    this.addEventListener("focusout", this.#onFocusout);
  }

  readonly #anchored = new AnchoredController(this, {
    anchor: () => this.#control!,
    panel: () => this.shadowRoot!.querySelector<HTMLElement>("[part=panel]")!,
    placement: () => "bottom-start",
  });

  get #control(): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>("[part=control]") ?? null
    );
  }

  get #hasPanel(): boolean {
    return this.querySelector(":scope > [slot=panel]") !== null;
  }

  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  #close(refocus: boolean) {
    this.open = false;
    if (refocus) this.#control?.focus();
  }

  // Focus that leaves for nowhere (a click on plain page) is the outside press's to handle.
  #onFocusout = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (this.open && next && !this.contains(next) && next !== this) {
      this.#close(false);
    }
  };

  // A panel added or removed changes what the item renders.
  readonly #children = new MutationObserver(() => this.requestUpdate());

  override connectedCallback() {
    super.connectedCallback();
    this.#children.observe(this, { childList: true });
    if (this.hasUpdated && this.open) this.#anchored.show();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#children.disconnect();
  }

  protected override updated(changed: PropertyValues<this>) {
    if (!this.#hasPanel) return;
    if (!changed.has("open")) return;
    // A panel that starts open is part of the page as loaded: it does not announce itself.
    const started = changed.get("open") === undefined;
    if (this.open) this.#anchored.show();
    else {
      // Hiding the panel would drop focus on <body>; the button is where the person came from.
      const root = this.getRootNode() as Document | ShadowRoot;
      const active = root.activeElement;
      const refocus = !!active && active !== this && this.contains(active);
      this.#anchored.hide();
      if (refocus) this.#control?.focus();
    }
    if (!started) {
      this.dispatchEvent(
        new CustomEvent("pl-toggle", {
          detail: { open: this.open },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  override render() {
    if (!this.#hasPanel)
      return html`<a
        part="control"
        href=${ifDefined(this.href)}
        aria-current=${this.current ? "page" : nothing}
        ><span part="label"><slot></slot></span
      ></a>`;
    return html`<button
        part="control"
        type="button"
        aria-expanded=${this.open ? "true" : "false"}
        aria-controls="panel"
        aria-current=${this.current ? "true" : nothing}
        @click=${() => (this.open = !this.open)}
      >
        <span part="label"><slot></slot></span>${chevron}
      </button>
      <div id="panel" part="panel" popover="manual">
        <slot name="panel"></slot>
      </div>`;
  }
}

/**
 * Site navigation: the host is the `navigation` landmark, holding `pl-navigation-item` children in a
 * row. Each item is a link or a disclosure button that opens a panel of links
 * (the APG disclosure navigation pattern, not a menu). Every link and button is
 * a tab stop. One panel is open at a time: opening one closes the others.
 *
 * @attr {string} label - The accessible name of the navigation landmark. Required.
 * @slot - `pl-navigation-item` children.
 * @csspart list - The row that lays out the items.
 */
export class PlNavigationMenu extends LitElement {
  static override styles = [barSurface, navigationMenuStyles];
  static override properties = { label: { type: String } };

  declare label: string;

  constructor() {
    super();
    this.label = "";
    this.addEventListener("pl-toggle", this.#onToggle);
  }

  #onToggle = (event: Event) => {
    const item = event.target;
    if (!(item instanceof PlNavigationItem) || !item.open) return;
    for (const other of this.querySelectorAll("pl-navigation-item"))
      if (other !== item) other.open = false;
  };

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "navigation");
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (!changed.has("label")) return;
    if (this.label) this.setAttribute("aria-label", this.label);
    else {
      this.removeAttribute("aria-label");
      console.warn("pl-navigation-menu needs a label.");
    }
  }

  override render() {
    return html`<div part="list"><slot></slot></div>`;
  }
}

customElements.define("pl-navigation-item", PlNavigationItem);
customElements.define("pl-navigation-menu", PlNavigationMenu);

declare global {
  interface HTMLElementTagNameMap {
    "pl-navigation-item": PlNavigationItem;
    "pl-navigation-menu": PlNavigationMenu;
  }
}
