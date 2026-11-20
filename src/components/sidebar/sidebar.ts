import { LitElement, html, nothing, svg } from "lit";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { SelectionController } from "../../behaviors/selection.ts";
import { PurrSidebarItem } from "./sidebar-item.ts";
import { sidebarStyles } from "./sidebar.css.ts";

export { PurrSidebarItem };

// design/icons/sidebar.svg
const sidebarIcon = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9.5 4v16M13 10l1-2 1.5 1 1.5-1 1 2" /></svg>`;

/**
 * A navigation sidebar: a `nav` landmark holding `purr-sidebar-item` children
 * (at most two levels). A level 1 item followed by level 2 items becomes a
 * disclosure button that shows and hides them. Every button and visible link is
 * a tab stop. As an extra, Up and Down arrows, Home and End move among all
 * visible items (Left and Right are not used). Space or Enter on a link selects
 * it; Escape on a group button or inside its group closes it and focuses the
 * button. On a narrow screen (600px or less) the sidebar collapses on its own;
 * shown again, it fills the width.
 *
 * @slot - `purr-sidebar-item` children.
 * @csspart toggle - The button that hides and shows the sidebar.
 * @csspart nav - The navigation landmark.
 * @fires purr-change - The selected item changed. `detail.selected` is an array holding the new item.
 * @fires purr-collapse - The sidebar was hidden or shown. `detail.collapsed` holds the new state.
 */
export class PurrSidebar extends LitElement {
  static override styles = sidebarStyles;
  static override properties = {
    label: { type: String },
    collapsed: { type: Boolean, reflect: true },
  };

  /** Accessible name of the navigation landmark. */
  declare label: string;
  declare collapsed: boolean;

  readonly #selection = new SelectionController<PurrSidebarItem>(this, {
    mode: "single",
    required: false,
  });
  readonly #roving = new RovingFocusController(this, {
    items: () => this.#items().filter((item) => !item.hidden),
    orientation: "vertical",
    wrap: false,
    tabStops: "all",
  });

  constructor() {
    super();
    this.label = "";
    this.collapsed = false;
  }

  #items(): PurrSidebarItem[] {
    return [...this.children].filter(
      (child): child is PurrSidebarItem => child instanceof PurrSidebarItem,
    );
  }

  /** Derives each item's disclosure and visibility from the levels in order. */
  #sync(reveal = false) {
    let parent: PurrSidebarItem | undefined;
    const items = this.#items();
    items.forEach((item, i) => {
      if (item.level === 1) {
        parent = item;
        item.expandable = items[i + 1]?.level === 2;
        item.hidden = false;
      } else {
        if (reveal && item.selected && parent) parent.expanded = true;
        item.hidden = parent ? !parent.expanded : false;
      }
    });
    this.requestUpdate();
  }

  #onSlotchange = () => this.#sync(true);

  #onClick = (event: Event) => {
    const item = event.target;
    if (
      !(item instanceof PurrSidebarItem) ||
      item.expandable ||
      !item.href ||
      item.selected
    )
      return;
    for (const other of this.#items()) other.selected = other === item;
    this.#selection.select(item);
  };

  #onKeydown = (event: KeyboardEvent) => {
    const item = event.target;
    if (!(item instanceof PurrSidebarItem)) return;
    if (event.key === " " && !item.expandable && item.href) {
      // Native links ignore Space; APG selects and activates the link.
      event.preventDefault();
      item.renderRoot.querySelector("a")?.click();
      return;
    }
    if (event.key !== "Escape") return;
    const items = this.#items();
    const parent =
      item.level === 2
        ? items
            .slice(0, items.indexOf(item))
            .reverse()
            .find((candidate) => candidate.level === 1)
        : item;
    if (!parent?.expandable || !parent.expanded) return;
    parent.expanded = false;
    this.#sync();
    parent.focus();
  };

  // Narrow screen, any pointer: the sidebar collapses on its own, so the app's
  // own navigation (a bottom tab bar is preferred) takes over.
  readonly #narrow = matchMedia("(max-width: 600px)");

  // A collapse the sidebar made itself is undone when the screen widens again;
  // one the person made, or undid, is theirs to keep.
  #autoCollapsed = false;
  #started = false;

  #onNarrow = () => {
    if (this.#narrow.matches && !this.collapsed) {
      this.#setCollapsed(true);
      this.#autoCollapsed = true;
    } else if (!this.#narrow.matches && this.#autoCollapsed && this.collapsed) {
      this.#setCollapsed(false);
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this.#narrow.addEventListener("change", this.#onNarrow);
    // Only the first connection follows the screen; moving the element keeps its state.
    if (!this.#started) this.#onNarrow();
    this.#started = true;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#narrow.removeEventListener("change", this.#onNarrow);
  }

  #toggleCollapsed = () => this.#setCollapsed(!this.collapsed);

  #setCollapsed(collapsed: boolean) {
    this.#autoCollapsed = false;
    this.collapsed = collapsed;
    this.dispatchEvent(
      new CustomEvent("purr-collapse", {
        detail: { collapsed: this.collapsed },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <button
        class="toggle"
        part="toggle"
        type="button"
        aria-expanded=${this.collapsed ? "false" : "true"}
        aria-label=${`${this.collapsed ? "Show" : "Hide"} ${this.label}`.trim()}
        @click=${this.#toggleCollapsed}
      >
        ${sidebarIcon}
      </button>
      <nav
        part="nav"
        aria-label=${this.label || nothing}
        @click=${this.#onClick}
        @keydown=${this.#onKeydown}
        @purr-toggle=${() => this.#sync()}
      >
        <slot @slotchange=${this.#onSlotchange}></slot>
      </nav>
    `;
  }
}

customElements.define("purr-sidebar", PurrSidebar);

declare global {
  interface HTMLElementTagNameMap {
    "purr-sidebar": PurrSidebar;
  }
}
