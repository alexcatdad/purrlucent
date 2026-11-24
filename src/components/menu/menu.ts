import { LitElement, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { DismissController } from "../../behaviors/dismiss.ts";
import { LensController } from "../../behaviors/lens.ts";
import { position } from "../../behaviors/position.ts";
import { matchIndex } from "../select/match.ts";
import {
  itemStyles,
  labelStyles,
  menuStyles,
  separatorStyles,
} from "./menu.css.ts";

const TYPE_AHEAD_MS = 500;
const HOVER_MS = 200;
const DISABLED_TRIGGER = ":disabled, [aria-disabled=true]";

/**
 * One command in a `pl-menu`. Its text is the label. With `type` it becomes a
 * checkbox or radio item; radio items in a run (no separator, label or other
 * kind of item between them) are a group. A nested `pl-menu` in the
 * `submenu` slot makes it open a submenu.
 *
 * @attr {string} value - What `pl-select` reports. Defaults to the label.
 * @attr {string} type - `checkbox` or `radio`. Empty for a plain command.
 * @attr {boolean} checked - Checked, for a checkbox or radio item.
 * @attr {boolean} disabled - Skipped by the keyboard and cannot be activated.
 * @attr {boolean} destructive - The command deletes or discards something.
 * @attr {string} detail - Trailing text such as a shortcut. The `detail` slot wins.
 * @attr {boolean} indent - Reserves the check column. The menu sets it.
 * @slot - The label.
 * @slot icon - A leading svg.
 * @slot detail - Trailing content, such as a shortcut.
 * @slot submenu - A nested `pl-menu`.
 * @csspart check - The check mark.
 * @csspart label - The label wrapper.
 * @csspart detail - The trailing text wrapper.
 * @csspart chevron - The submenu arrow.
 */
export class PlMenuItem extends LitElement {
  static override styles = itemStyles;
  static override properties = {
    value: { reflect: true },
    type: { reflect: true },
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    destructive: { type: Boolean, reflect: true },
    detail: { reflect: true },
    indent: { type: Boolean, reflect: true },
    hasSubmenu: { state: true },
  };

  declare value: string;
  declare type: "" | "checkbox" | "radio";
  declare checked: boolean;
  declare disabled: boolean;
  declare destructive: boolean;
  declare detail: string;
  declare indent: boolean;
  declare hasSubmenu: boolean;

  readonly #internals = this.attachInternals();

  constructor() {
    super();
    this.value = "";
    this.type = "";
    this.checked = false;
    this.disabled = false;
    this.destructive = false;
    this.detail = "";
    this.indent = false;
    this.hasSubmenu = false;
  }

  /** The item's own text, without its detail or submenu. */
  get label(): string {
    return [...this.childNodes]
      .filter((node) =>
        node instanceof Element ? !node.slot : node.nodeType === Node.TEXT_NODE,
      )
      .map((node) => node.textContent)
      .join("")
      .trim();
  }

  get itemValue(): string {
    return this.value || this.label;
  }

  get submenu(): PlMenu | null {
    return this.querySelector(":scope > pl-menu");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.tabIndex = -1;
  }

  protected override updated() {
    const checkable = this.type === "checkbox" || this.type === "radio";
    this.setAttribute("role", checkable ? `menuitem${this.type}` : "menuitem");
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    if (checkable) this.setAttribute("aria-checked", String(this.checked));
    else this.removeAttribute("aria-checked");
    if (this.hasSubmenu) this.setAttribute("aria-haspopup", "menu");
    else this.removeAttribute("aria-haspopup");
    // An open submenu's text would otherwise become part of this row's name.
    this.#internals.ariaLabelledByElements = this.hasSubmenu
      ? [this.shadowRoot!.querySelector("[part=label]")!]
      : null;
  }

  override render() {
    return html`${
        this.indent
          ? html`<svg part="check" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12l5 5l10 -10" />
            </svg>`
          : nothing
      }<slot name="icon"></slot><span part="label"><slot></slot></span
      ><span part="detail"><slot name="detail">${this.detail}</slot></span
      >${
        this.hasSubmenu
          ? html`<svg part="chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6l-6 6" />
            </svg>`
          : nothing
      }<span part="anchor" aria-hidden="true"></span
      ><span part="anchor-flip" aria-hidden="true"></span
      ><slot
        name="submenu"
        @slotchange=${() => (this.hasSubmenu = this.submenu !== null)}
      ></slot>`;
  }
}

/** A thin rule between groups of items. */
export class PlMenuSeparator extends LitElement {
  static override styles = separatorStyles;

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "separator");
  }
}

/** A section header inside a `pl-menu`. Its text is the heading. */
export class PlMenuLabel extends LitElement {
  static override styles = labelStyles;

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "presentation");
  }

  override render() {
    return html`<slot></slot>`;
  }
}

/**
 * A menu: a list of commands that opens from a trigger (the menu button
 * pattern), at a point (a context menu, see `showAt`) or from a parent item (a
 * submenu, `slot="submenu"`). The items are the light-DOM children, so focus
 * moves to them while the menu is open and returns to the trigger on close.
 * Arrow keys move with wrap, Home and End jump, typing jumps to a label,
 * Enter and Space activate, Escape closes one level, Tab closes all of them.
 * Activating an item closes every level and fires `pl-select`.
 *
 * @attr {string} label - The accessible name of the menu.
 * @attr {boolean} open - The menu is showing.
 * @slot trigger - A focusable control that opens the menu. It gets `aria-haspopup` and `aria-expanded`.
 * @slot - The `pl-menu-item`, `pl-menu-separator` and `pl-menu-label` children.
 * @csspart menu - The popup.
 * @fires {CustomEvent<{ value: string }>} pl-select - An item was activated. `detail.value` holds its value.
 */
export class PlMenu extends LitElement {
  static override styles = menuStyles;
  static override properties = {
    label: { reflect: true },
    open: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare open: boolean;

  #query = "";
  #timer: ReturnType<typeof setTimeout> | undefined;
  #hover: ReturnType<typeof setTimeout> | undefined;
  #focusOnOpen: "first" | "last" | null = "first";
  #opener: HTMLElement | null = null;
  #atPoint = false;

  constructor() {
    super();
    new LensController(this, () =>
      this.renderRoot.querySelector<HTMLElement>("[part=menu]"),
    );
    this.label = "";
    this.open = false;
    // Only the root listens: a press on a parent row must not close its submenu.
    new DismissController(this, {
      enabled: () => this.open && !this.#parent,
      onDismiss: (reason) => this.#close(reason === "escape"),
    });
    this.addEventListener("keydown", this.#onKeydown);
    this.addEventListener("click", this.#onClick);
    this.addEventListener("pointerover", this.#onPointerover);
  }

  get #parent(): PlMenuItem | null {
    return this.slot === "submenu" ? (this.parentElement as PlMenuItem) : null;
  }

  get #root(): PlMenu {
    const parent = this.#parent;
    return parent ? (parent.parentElement as PlMenu).#root : this;
  }

  get #items(): PlMenuItem[] {
    return [...this.children].filter(
      (el): el is PlMenuItem => el instanceof PlMenuItem,
    );
  }

  get #enabled(): PlMenuItem[] {
    return this.#items.filter((item) => !item.disabled);
  }

  get #trigger(): HTMLElement | null {
    return this.querySelector(":scope > [slot=trigger]");
  }

  get #list(): HTMLElement {
    return this.shadowRoot!.querySelector("[part=menu]")!;
  }

  /** Opens the menu with its corner at viewport point (x, y), for a context menu. */
  showAt(x: number, y: number) {
    const point = this.shadowRoot!.querySelector<HTMLElement>("[part=point]")!;
    point.style.left = `${x}px`;
    point.style.top = `${y}px`;
    const wasOpen = this.open;
    this.#opener = document.activeElement as HTMLElement | null;
    this.#atPoint = true;
    this.#focusOnOpen = "first";
    this.open = true;
    if (wasOpen) this.#reposition();
  }

  hide() {
    this.#close(true);
  }

  #close(refocus: boolean) {
    for (const sub of this.querySelectorAll<PlMenu>("pl-menu"))
      sub.open = false;
    const hadFocus = this.matches(":focus-within");
    this.open = false;
    this.#atPoint = false;
    if (refocus || (hadFocus && this.#parent))
      (this.#parent ?? this.#trigger ?? this.#opener)?.focus();
  }

  #openSub(item: PlMenuItem, focus: boolean) {
    const sub = item.submenu;
    if (!sub || item.disabled) return;
    this.#closeSubsExcept(item);
    sub.#focusOnOpen = focus ? "first" : null;
    sub.open = true;
  }

  #closeSubsExcept(keep: PlMenuItem | null) {
    for (const item of this.#items) {
      const sub = item.submenu;
      if (item !== keep && sub) sub.#close(false);
    }
  }

  #activate(item: PlMenuItem) {
    const kids = [...this.children];
    const isRadio = (el?: Element) =>
      el instanceof PlMenuItem && el.type === "radio";
    if (item.type === "checkbox") item.checked = !item.checked;
    else if (item.type === "radio") {
      let from = kids.indexOf(item);
      let to = from;
      while (isRadio(kids[from - 1])) from--;
      while (isRadio(kids[to + 1])) to++;
      for (const kid of kids.slice(from, to + 1))
        (kid as PlMenuItem).checked = kid === item;
    }
    this.dispatchEvent(
      new CustomEvent("pl-select", {
        detail: { value: item.itemValue },
        bubbles: true,
        composed: true,
      }),
    );
    this.#root.#close(true);
  }

  #openFromTrigger(which: "first" | "last") {
    this.#focusOnOpen = which;
    if (this.open) this.#focusItem();
    else this.open = true;
  }

  #focusItem() {
    const items = this.#enabled;
    (this.#focusOnOpen === "last" ? items.at(-1) : items[0])?.focus();
  }

  // Events from a submenu also bubble through its parent row and menu, so each
  // handler acts only on what belongs to this menu.
  #owns(event: Event): Element | null {
    const target = event.target as Element;
    return target.closest("pl-menu") === this ? target : null;
  }

  #onClick = (event: MouseEvent) => {
    const target = this.#owns(event);
    if (!target) return;
    const trigger = target.closest("[slot=trigger]");
    if (trigger) {
      if (trigger.matches(DISABLED_TRIGGER)) return;
      if (this.open) this.#close(true);
      else this.#openFromTrigger("first");
      return;
    }
    const item = target.closest("pl-menu-item");
    if (!item || item.disabled) return;
    if (item.submenu) this.#openSub(item, true);
    else this.#activate(item);
  };

  #onKeydown = (event: KeyboardEvent) => {
    const target = this.#owns(event);
    if (!target || event.ctrlKey || event.metaKey) return;
    const { key } = event;
    const items = this.#enabled;
    const current = items.indexOf(target as PlMenuItem);
    const rtl = this.matches(":dir(rtl)");
    const parent = this.#parent;

    const trigger = target.closest("[slot=trigger]");
    if (trigger) {
      if (
        (key === "ArrowDown" || key === "ArrowUp") &&
        !trigger.matches(DISABLED_TRIGGER)
      ) {
        event.preventDefault();
        this.#openFromTrigger(key === "ArrowDown" ? "first" : "last");
      }
      return;
    }
    if (current < 0 || !this.open) return;

    const go = (to: number) => {
      event.preventDefault();
      items[(to + items.length) % items.length]?.focus();
    };
    const ownedSub = items[current]!.submenu;
    if (key === "Tab") this.#root.#close(true);
    else if (key === "Escape" && ownedSub?.open) {
      // A hover-opened submenu leaves focus on its row; Escape closes only that level.
      event.preventDefault();
      event.stopPropagation();
      ownedSub.#close(false);
    } else if (key === "ArrowDown") go(current + 1);
    else if (key === "ArrowUp") go(current - 1);
    else if (key === "Home") go(0);
    else if (key === "End") go(-1);
    else if (key === (rtl ? "ArrowLeft" : "ArrowRight")) {
      const item = items[current]!;
      if (item.submenu) {
        event.preventDefault();
        this.#openSub(item, true);
      }
    } else if (
      parent &&
      (key === (rtl ? "ArrowRight" : "ArrowLeft") || key === "Escape")
    ) {
      // Escape would otherwise reach the root's dismissal and close every level.
      event.preventDefault();
      event.stopPropagation();
      this.#close(true);
    } else if (key === "Enter" || (key === " " && !this.#query)) {
      event.preventDefault();
      items[current]!.click();
    } else if (
      key.length === 1 &&
      !event.altKey &&
      (key !== " " || this.#query)
    ) {
      event.preventDefault();
      this.#query += key;
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => (this.#query = ""), TYPE_AHEAD_MS);
      const hit = matchIndex(
        items.map((item) => item.label),
        this.#query,
        current,
      );
      if (hit >= 0) items[hit]!.focus();
    }
  };

  #onPointerover = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    clearTimeout(this.#hover);
    const target = this.#owns(event);
    const item = target?.closest("pl-menu-item");
    if (!item) return;
    item.focus({ preventScroll: true });
    this.#hover = setTimeout(() => {
      if (item.submenu) this.#openSub(item, false);
      else this.#closeSubsExcept(null);
    }, HOVER_MS);
  };

  #reposition = () => {
    const list = this.#list;
    const parent = this.#parent;
    if (!parent) {
      const anchor = this.#atPoint
        ? this.shadowRoot!.querySelector("[part=point]")!
        : (this.#trigger ?? this.shadowRoot!.querySelector("[part=point]")!);
      // A point has no edge to keep clear of; a trigger gets the list's margin as a gap.
      list.style.marginBlock = this.#atPoint ? "0" : "";
      position(anchor, list, "bottom-start");
      return;
    }
    const anchor = parent.shadowRoot!.querySelector("[part=anchor]")!;
    position(anchor, list, "bottom-start");
    // The viewport clamp moved it off the anchor: slide it to the row's other side.
    const box = list.getBoundingClientRect();
    const edge = anchor.getBoundingClientRect();
    const slid = this.matches(":dir(rtl)")
      ? box.right - edge.right
      : box.left - edge.left;
    if (Math.abs(slid) > 1)
      position(
        parent.shadowRoot!.querySelector("[part=anchor-flip]")!,
        list,
        "bottom-end",
      );
  };

  #syncAnchor() {
    const anchor = this.#parent ?? this.#trigger;
    if (!this.#parent) anchor?.setAttribute("aria-haspopup", "menu");
    anchor?.setAttribute("aria-expanded", String(this.open));
  }

  #onItems = () => {
    const items = this.#items;
    const checkable = items.some((item) => item.type);
    for (const item of items) item.indent = checkable;
  };

  protected override updated(changed: PropertyValues<this>) {
    this.#syncAnchor();
    if (!changed.has("open")) return;
    const list = this.#list;
    if (this.open && !list.matches(":popover-open")) {
      list.showPopover();
      this.#reposition();
      addEventListener("resize", this.#reposition);
      addEventListener("scroll", this.#reposition, true);
      if (this.#focusOnOpen) this.#focusItem();
      if (!this.#parent) this.#focusOnOpen = "first";
    } else if (!this.open && list.matches(":popover-open")) {
      // Closing through `open` leaves focus on a row that is about to be hidden.
      if (this.querySelector("pl-menu-item:focus"))
        (this.#parent ?? this.#trigger ?? this.#opener)?.focus();
      list.hidePopover();
      removeEventListener("resize", this.#reposition);
      removeEventListener("scroll", this.#reposition, true);
    }
  }

  // `type` can change after the slot was assigned, which slotchange does not report.
  readonly #types = new MutationObserver(() => this.#onItems());

  override connectedCallback() {
    super.connectedCallback();
    this.#types.observe(this, {
      subtree: true,
      attributes: true,
      attributeFilter: ["type"],
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#types.disconnect();
    clearTimeout(this.#timer);
    clearTimeout(this.#hover);
    removeEventListener("resize", this.#reposition);
    removeEventListener("scroll", this.#reposition, true);
  }

  override render() {
    return html`<slot
        name="trigger"
        @slotchange=${() => this.#syncAnchor()}
      ></slot
      ><span part="point" aria-hidden="true"></span>
      <div
        part="menu"
        role="menu"
        popover="manual"
        aria-label=${this.label || nothing}
      >
        <slot @slotchange=${this.#onItems}></slot>
      </div>`;
  }
}

customElements.define("pl-menu-item", PlMenuItem);
customElements.define("pl-menu-separator", PlMenuSeparator);
customElements.define("pl-menu-label", PlMenuLabel);
customElements.define("pl-menu", PlMenu);

declare global {
  interface HTMLElementTagNameMap {
    "pl-menu-item": PlMenuItem;
    "pl-menu-separator": PlMenuSeparator;
    "pl-menu-label": PlMenuLabel;
    "pl-menu": PlMenu;
  }
}
