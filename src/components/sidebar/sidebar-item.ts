import { LitElement, html, nothing, svg } from "lit";
import type { PropertyValues } from "lit";
import { fill, messages } from "../../behaviors/locale.ts";
import type { PlMenu } from "../menu/menu.ts";
import "../menu/menu.ts";
import { parseLevel, type SidebarLevel } from "./level.ts";
import { itemStyles } from "./sidebar.css.ts";

// design/icons/chevron-right.svg
const chevron = svg`<svg class="chevron" part="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.25 5.75 5.5 5.5q.75.75 0 1.5l-5.5 5.5" /></svg>`;

// design/icons/grip.svg
const grip = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="6" r="1.45" /><circle cx="15" cy="6" r="1.45" /><circle cx="9" cy="12" r="1.45" /><circle cx="15" cy="12" r="1.45" /><circle cx="9" cy="18" r="1.45" /><circle cx="15" cy="18" r="1.45" /></svg>`;

// Leaves leave the chevron slot empty, so every level 1 label shares one edge.
const label = html`<span class="label"
  ><slot></slot><slot name="description"></slot
></span>`;
// The icon's gap is applied to the wrapper once the slot holds something.
const onIcon = (event: Event) => {
  const slot = event.target as HTMLSlotElement;
  slot.parentElement?.toggleAttribute(
    "data-filled",
    slot.assignedElements().length > 0,
  );
};
const icon = html`<span class="icon"
  ><slot name="icon" @slotchange=${onIcon}></slot
></span>`;
const detail = html`<slot name="detail"></slot>`;

/**
 * One entry of a `pl-sidebar`. It renders a link, or, when `expandable` is set
 * by the sidebar because level 2 items follow it, a disclosure button. An
 * expandable item with an `href` keeps its link, which selects like any other,
 * and gets a separate disclosure button before it. Without an `href` an item
 * renders a plain button; clicking it selects it, so an app can also handle the
 * click itself. With `action` it is a plain button that never takes the
 * selection, such as a menu trigger: listen for its `click`.
 *
 * @attr {string} toggle-label - The disclosure button's accessible name when a link has one beside it. Defaults to the page language's text (see `setMessages`), in English "<item label>, show items".
 * @attr {boolean} action - Renders a button that does not take the selection; `href` and `selected` are ignored and it never has a disclosure. Use it for a menu trigger or a command. `aria-haspopup`, `aria-expanded` and `aria-controls` set on the item, as `pl-menu` does for its trigger, are passed on to the button that holds focus; `aria-controls` only where the browser can point into the page.
 * @attr {string} size - `md` or `lg`, the row size of this item. Defaults to the sidebar's `size`.
 * @slot - The item label. A label wider than the row ends in an ellipsis on one line, and its full text becomes the control's title.
 * @slot icon - A leading svg icon, tinted with the accent text color. A `pl-avatar` here is sized to fit the row.
 * @slot description - A second, muted line under the label.
 * @slot detail - Trailing muted text, such as a count.
 * @csspart control - The link or disclosure button.
 * @csspart disclosure - The disclosure button beside a link.
 * @csspart chevron - The disclosure arrow.
 * @csspart handle - The grip a level 1 item shows while the sidebar is `reorderable`. Drag it or press it for the move commands. Alt with the Up and Down arrows moves the item from the keyboard.
 * @fires {CustomEvent<{ expanded: boolean }>} pl-toggle - A disclosure button opened or closed. `detail.expanded` holds the new state.
 * @fires {CustomEvent<{ href: string }>} pl-navigate - A plain left click, or Enter, activated the link, before the browser navigates. `detail.href` holds the address. Cancelable: `preventDefault()` stops the navigation, so a router can take over.
 * @fires {CustomEvent<{ from: number, to: number }>} pl-reorder - A move command, drag or Alt with an arrow key asked to move this level 1 item. `from` and `to` are its place among the level 1 items of its section or sidebar. The app moves the item.
 */
export class PlSidebarItem extends LitElement {
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
    action: { type: Boolean, reflect: true },
    size: { reflect: true },
    reorderable: { type: Boolean, reflect: true },
    canMoveUp: { state: true },
    canMoveDown: { state: true },
    chevron: { reflect: true },
    _full: { state: true },
  };

  declare href: string | undefined;
  declare selected: boolean;
  declare action: boolean;
  declare size: "md" | "lg" | undefined;
  /** Set by the sidebar when it is `reorderable` and this is a level 1 item. */
  declare reorderable: boolean;
  // Set by the sidebar from this item's position in its section.
  declare canMoveUp: boolean;
  declare canMoveDown: boolean;
  /** Set by the sidebar: `end` or `start`, where the disclosure chevron sits. */
  declare chevron: "end" | "start";
  /** Set by the sidebar when level 2 items follow this one. */
  declare expandable: boolean;
  declare expanded: boolean;
  declare toggleLabel: string;
  /** The full text of a label or description that is cut off, shown as the control's title. */
  declare _full: string | undefined;

  #level: SidebarLevel = 1;

  // A menu sets these on the host; the focused control inside needs them.
  readonly #forwarded = new MutationObserver(() => this.requestUpdate());
  readonly #resized = new ResizeObserver(() => this.#measure());

  constructor() {
    super();
    this.selected = false;
    this.expandable = false;
    this.expanded = false;
    this.toggleLabel = "";
    this.action = false;
    this.reorderable = false;
    this.canMoveUp = false;
    this.canMoveDown = false;
    this.chevron = "end";
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#forwarded.observe(this, {
      attributes: true,
      attributeFilter: ["aria-haspopup", "aria-expanded", "aria-controls"],
    });
    this.#resized.observe(this);
    // Text changes in the light DOM raise no slotchange, so measure on approach.
    this.addEventListener("pointerenter", this.#measure);
    this.addEventListener("focusin", this.#measure);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#forwarded.disconnect();
    this.#resized.disconnect();
    this.removeEventListener("pointerenter", this.#measure);
    this.removeEventListener("focusin", this.#measure);
  }

  protected override firstUpdated() {
    this.renderRoot.addEventListener("slotchange", this.#measure);
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.size) this.#measure();
    this.#controls();
  }

  /** Sets the title to the text that is cut off, so the full label is one hover away. */
  #measure = () => {
    const cut = (el: Element | null) => !!el && el.scrollWidth > el.clientWidth;
    const description = this.querySelector<HTMLElement>("[slot=description]");
    const parts = [
      cut(this.renderRoot.querySelector(".label")) && this.#text(),
      cut(description) && description?.textContent?.trim(),
    ].filter(Boolean);
    this._full = parts.join(" ") || undefined;
  };

  protected override willUpdate() {
    // An action never takes the selection, whatever the app set.
    if (this.action) this.selected = false;
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
      new CustomEvent("pl-toggle", {
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
      next instanceof PlSidebarItem && next.level === 2;
      next = next.nextElementSibling
    )
      children.push(next);
    return children;
  }

  /** The label text: the children that are not in a named slot. */
  #text() {
    return [...this.childNodes]
      .filter((node) =>
        node instanceof Element ? !node.slot : node.nodeType === Node.TEXT_NODE,
      )
      .map((node) => node.textContent)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** The disclosure button's name: `toggle-label`, else "<label>, show items". */
  #name() {
    if (this.toggleLabel) return this.toggleLabel;
    return fill(messages(this).showItemsFor, { label: this.#text() });
  }

  #controls() {
    type Controls = HTMLElement & { ariaControlsElements?: Element[] | null };
    // The controlled items sit in the light DOM, out of reach of an id reference.
    const button = this.renderRoot.querySelector<Controls>(".disclosure");
    if (button && "ariaControlsElements" in button)
      button.ariaControlsElements = this.#children();
    // An id in the page cannot be named from this shadow tree; an element
    // reference can, and where it is not supported the attribute is left out.
    const action = this.action
      ? this.renderRoot.querySelector<Controls>(".control")
      : null;
    if (action && "ariaControlsElements" in action) {
      const id = this.getAttribute("aria-controls");
      const target = id
        ? (this.getRootNode() as Document | ShadowRoot).getElementById(id)
        : null;
      action.ariaControlsElements = target ? [target] : null;
    }
  }

  override render() {
    const menu = this.reorderable && this.level === 1;
    return html`${this.#control()}${menu ? this.#reorderMenu() : nothing}`;
  }

  #reorderMenu() {
    const text = messages(this);
    const name = fill(text.showOptionsFor, { label: this.#text() });
    return html`
      <pl-menu
        class="reorder-menu"
        label=${name}
        placement="end-start"
        @click=${(event: Event) => event.stopPropagation()}
        @keydown=${this.#onReorderKeydown}
        @pl-toggle=${(event: Event) => event.stopPropagation()}
      >
        <button
          slot="trigger"
          type="button"
          class="handle"
          part="handle"
          aria-label=${name}
          title=${name}
        >
          ${grip}
        </button>
        <pl-menu-item value="up" ?disabled=${!this.canMoveUp}
          >${text.moveUp}</pl-menu-item
        >
        <pl-menu-item value="down" ?disabled=${!this.canMoveDown}
          >${text.moveDown}</pl-menu-item
        >
      </pl-menu>
    `;
  }

  #onReorderKeydown = (event: KeyboardEvent) => {
    const menu = event.currentTarget as PlMenu;
    if (event.key !== "Escape" || !menu.open) return;
    event.preventDefault();
    event.stopPropagation();
    menu.hide();
  };

  #control() {
    // Opens a reorder with Alt and an arrow key; a screen reader announces it.
    const keys =
      this.reorderable && this.level === 1
        ? "Alt+ArrowUp Alt+ArrowDown"
        : nothing;
    if (this.action)
      return html`<button
        class="control"
        part="control"
        title=${this._full ?? nothing}
        type="button"
        aria-keyshortcuts=${keys}
        aria-haspopup=${this.getAttribute("aria-haspopup") ?? nothing}
        aria-expanded=${this.getAttribute("aria-expanded") ?? nothing}
      >
        ${icon}${label}${detail}
      </button>`;
    if (this.expandable && this.href) {
      // A destination and a disclosure: two controls, the button on the
      // chevron's side, so it follows the link at the end and precedes it at
      // the start.
      const button = html`<button
        class="disclosure"
        part="disclosure"
        type="button"
        aria-expanded=${this.expanded ? "true" : "false"}
        aria-label=${this.#name()}
        @click=${this.#toggle}
      >
        ${chevron}
      </button>`;
      const link = html`<a
        class="control"
        part="control"
        title=${this._full ?? nothing}
        href=${this.href}
        aria-current=${this.selected ? "page" : nothing}
        aria-keyshortcuts=${keys}
        @slotchange=${() => this.requestUpdate()}
        >${icon}${label}${detail}</a
      >`;
      return this.chevron === "start"
        ? html`${button}${link}`
        : html`${link}${button}`;
    }
    if (this.expandable && this.chevron !== "start")
      return html`<button
        class="control"
        part="control"
        title=${this._full ?? nothing}
        type="button"
        aria-expanded=${this.expanded ? "true" : "false"}
        aria-keyshortcuts=${keys}
        @click=${this.#toggle}
      >
        ${icon}${label}${detail}${chevron}
      </button>`;
    if (this.expandable)
      return html`<button
        class="control"
        part="control"
        title=${this._full ?? nothing}
        type="button"
        aria-expanded=${this.expanded ? "true" : "false"}
        aria-keyshortcuts=${keys}
        @click=${this.#toggle}
      >
        ${chevron}${icon}${label}${detail}
      </button>`;
    return this.href
      ? html`<a
          class="control"
          part="control"
          title=${this._full ?? nothing}
          href=${this.href}
          aria-current=${this.selected ? "page" : nothing}
          aria-keyshortcuts=${keys}
          >${icon}${label}${detail}</a
        >`
      : // Without a destination an anchor is not focusable, so use a button.
        html`<button
          class="control"
          part="control"
          title=${this._full ?? nothing}
          type="button"
          aria-current=${this.selected ? "page" : nothing}
          aria-keyshortcuts=${keys}
        >
          ${icon}${label}${detail}
        </button>`;
  }
}

customElements.define("pl-sidebar-item", PlSidebarItem);

declare global {
  interface HTMLElementTagNameMap {
    "pl-sidebar-item": PlSidebarItem;
  }
}
