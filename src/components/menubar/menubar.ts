import { LitElement, html, type PropertyValues } from "lit";
import { LensController } from "../../behaviors/lens.ts";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { barSurface } from "../../surfaces/surfaces.css.ts";
import { PlMenu } from "../menu/menu.ts";
import { menubarStyles } from "./menubar.css.ts";

const isEnabled = (el: HTMLElement) =>
  !el.hidden &&
  !el.hasAttribute("disabled") &&
  el.getAttribute("aria-disabled") !== "true";

/**
 * A row of menus, as at the top of an app window: each `pl-menu` child keeps
 * its own `trigger`, items and submenus. The bar has one tab stop. Left and
 * Right move between the triggers with wrap, and Down, Up, Enter and Space open
 * a menu through `pl-menu`. While a menu is open, Left and Right close it and
 * open the neighboring menu, and Escape closes it and returns to its trigger.
 * Arrows follow the text direction. Items activate as in `pl-menu`.
 *
 * Each trigger is a focusable control with text, such as a `pl-button`. The bar
 * sets `role="menuitem"` on it.
 *
 * @attr {string} label - The accessible name of the bar. Required.
 * @slot - The `pl-menu` elements, each with a `trigger`.
 * @fires {CustomEvent<{ value: string }>} pl-select - An item of one of the menus was activated. `detail.value` holds its value.
 */
export class PlMenubar extends LitElement {
  static override styles = [barSurface, menubarStyles];
  static override properties = { label: { reflect: true } };

  declare label: string;

  readonly roving = new RovingFocusController(this, {
    items: () => this.#triggers(),
    orientation: "horizontal",
    wrap: true,
  });

  constructor() {
    super();
    new LensController(this);
    this.label = "";
    this.addEventListener("keydown", this.#onKeydown);
  }

  #trigger(menu: PlMenu) {
    return menu.querySelector<HTMLElement>(":scope > [slot=trigger]");
  }

  /** The menus whose trigger can take focus, in order. */
  #menus(): PlMenu[] {
    return [...this.children].filter(
      (el): el is PlMenu =>
        el instanceof PlMenu &&
        !!this.#trigger(el) &&
        isEnabled(this.#trigger(el)!),
    );
  }

  #triggers(): HTMLElement[] {
    return this.#menus().map((menu) => this.#trigger(menu)!);
  }

  // With a menu open, the arrows reach the bar only from a row that has no
  // submenu to open or close; `pl-menu` handles and stops the others.
  #onKeydown = (event: KeyboardEvent) => {
    const rtl = this.matches(":dir(rtl)");
    const step =
      event.key === (rtl ? "ArrowLeft" : "ArrowRight")
        ? 1
        : event.key === (rtl ? "ArrowRight" : "ArrowLeft")
          ? -1
          : 0;
    const target = event.target as Element;
    if (
      !step ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !target.closest("pl-menu-item")
    )
      return;
    const menus = this.#menus();
    const from = menus.findIndex((menu) => menu.open && menu.contains(target));
    if (from < 0 || menus.length < 2) return;
    event.preventDefault();
    const to = (from + step + menus.length) % menus.length;
    menus[from]!.hide();
    this.roving.activate(to);
    menus[to]!.open = true;
  };

  // The tab stop and the roles follow the menus that are added, removed or disabled.
  readonly #watcher = new MutationObserver(() => this.requestUpdate());

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "menubar");
    this.#watcher.observe(this, {
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "hidden"],
      childList: true,
      subtree: true,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watcher.disconnect();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (!changed.has("label")) return;
    if (this.label) this.setAttribute("aria-label", this.label);
    else {
      this.removeAttribute("aria-label");
      console.warn("pl-menubar needs a label.");
    }
  }

  protected override updated() {
    for (const el of this.children)
      if (el instanceof PlMenu)
        this.#trigger(el)?.setAttribute("role", "menuitem");
  }

  override render() {
    return html`<slot @slotchange=${() => this.requestUpdate()}></slot>`;
  }
}

customElements.define("pl-menubar", PlMenubar);

declare global {
  interface HTMLElementTagNameMap {
    "pl-menubar": PlMenubar;
  }
}
