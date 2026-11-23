import { LitElement, html, nothing, svg, type PropertyValues } from "lit";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { PlSidebarItem } from "./sidebar-item.ts";
import { PlSidebarSection } from "./sidebar-section.ts";
import { sidebarStyles } from "./sidebar.css.ts";

export { PlSidebarItem, PlSidebarSection };

const TOGGLE_LABEL = "Sidebar";

// design/icons/sidebar.svg
const sidebarIcon = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9.5 4v16M13 10l1-2 1.5 1 1.5-1 1 2" /></svg>`;

/**
 * A navigation sidebar: a `nav` landmark holding `pl-sidebar-item` children,
 * loose or grouped under `pl-sidebar-section` headings (at most two levels,
 * and a group never reaches into the next section). A level 1 item followed by level 2 items becomes a
 * disclosure button that shows and hides them; with an `href` it stays a link
 * that selects, and the disclosure button sits before it. Every button and visible link is
 * a tab stop. As an extra, Up and Down arrows, Home and End move among all
 * visible items (Left and Right are not used). Space or Enter on a link selects
 * it; Escape on a group button or inside its group closes it and focuses the
 * button. On a narrow screen (600px or less) the sidebar collapses on its own;
 * shown again, it fills the width. A collapse it made itself is undone when
 * the screen widens; read the first state from `collapsed`, because
 * `pl-collapse` can fire before a listener is attached.
 *
 * @attr {string} toggle-label - The toggle button's accessible name. Defaults to "Sidebar", which becomes "<label> sidebar" when `label` is set.
 * @slot - `pl-sidebar-item` and `pl-sidebar-section` children.
 * @csspart toggle - The button that hides and shows the sidebar.
 * @csspart nav - The navigation landmark.
 * @fires pl-change - The selected item changed. `detail.selected` is an array holding the new item.
 * @fires pl-collapse - The sidebar was hidden or shown. `detail.collapsed` holds the new state.
 */
export class PlSidebar extends LitElement {
  static override styles = sidebarStyles;
  static override properties = {
    label: { type: String },
    collapsed: { type: Boolean, reflect: true },
    size: { reflect: true },
    toggleLabel: { attribute: "toggle-label" },
  };

  /** Accessible name of the navigation landmark. */
  declare label: string;
  declare collapsed: boolean;
  /** `md` (default) or `lg`, the larger rows. */
  declare size: "md" | "lg";
  declare toggleLabel: string;

  // An item's group, level or selection changed from outside; reveal only
  // follows a selection, so an app can still close a group holding the page.
  readonly #watcher = new MutationObserver((records) =>
    this.#sync(records.some((record) => record.attributeName === "selected")),
  );
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
    this.size = "md";
    this.toggleLabel = TOGGLE_LABEL;
  }

  /** The items in document order, loose or inside a section. */
  #items() {
    return [
      ...this.querySelectorAll<PlSidebarItem>(
        ":scope > pl-sidebar-item, :scope > pl-sidebar-section > pl-sidebar-item",
      ),
    ];
  }

  /** Derives each item's disclosure and visibility from the levels in order. */
  #sync(reveal = false) {
    let parent: PlSidebarItem | undefined;
    const items = this.#items();
    items.forEach((item, i) => {
      // A group of level 2 items never reaches across a section boundary.
      if (item.parentElement !== items[i - 1]?.parentElement)
        parent = undefined;
      if (item.level === 1) {
        parent = item;
        const next = items[i + 1];
        item.expandable =
          next?.level === 2 && next.parentElement === item.parentElement;
        item.hidden = false;
        // Its button names the items that follow, which may have changed.
        if (item.expandable) item.requestUpdate();
      } else {
        if (reveal && item.selected && parent) parent.expanded = true;
        item.hidden = parent ? !parent.expanded : false;
      }
    });
    this.requestUpdate();
  }

  #onSlotchange = () => this.#sync(true);

  #onClick = (event: MouseEvent) => {
    const item = event.target;
    // A parent link selects; its disclosure button, like any group button, does not.
    const origin = event.composedPath()[0];
    if (
      !(item instanceof PlSidebarItem) ||
      (item.expandable &&
        (!item.href ||
          (origin instanceof Element && origin.closest("button")))) ||
      item.selected ||
      // A modified click opens the link elsewhere; this page stays current.
      (item.href &&
        (event.button !== 0 ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey))
    )
      return;
    for (const other of this.#items()) other.selected = other === item;
    this.dispatchEvent(
      new CustomEvent("pl-change", {
        detail: { selected: [item] },
        bubbles: true,
        composed: true,
      }),
    );
  };

  #onKeydown = (event: KeyboardEvent) => {
    const item = event.target;
    if (!(item instanceof PlSidebarItem)) return;
    const origin = event.composedPath()[0];
    if (event.key === " " && origin instanceof HTMLAnchorElement) {
      // Native links ignore Space; APG selects and activates the link.
      event.preventDefault();
      origin.click();
      return;
    }
    if (event.key !== "Escape") return;
    const items = this.#items();
    const parent =
      item.level === 2
        ? items
            .slice(0, items.indexOf(item))
            .reverse()
            .find(
              (candidate) =>
                candidate.level === 1 &&
                candidate.parentElement === item.parentElement,
            )
        : item;
    if (!parent?.expandable || !parent.expanded) return;
    // The button's own handler closes it and fires pl-toggle.
    parent.renderRoot.querySelector("button")?.click();
    parent.focus();
  };

  // Narrow screen, any pointer: the sidebar collapses on its own, so the app's
  // own navigation (a bottom tab bar is preferred) takes over.
  readonly #narrow = matchMedia("(max-width: 600px)");

  // A collapse the sidebar made itself is undone when the screen widens again;
  // one the person or the app made, or undid, is theirs to keep.
  #autoCollapsed = false;
  // The screen width last acted on, so a move in the page changes nothing but
  // a crossing while detached is caught on reconnect.
  #wasNarrow?: boolean;

  #onNarrow = () => {
    this.#wasNarrow = this.#narrow.matches;
    if (this.#narrow.matches && !this.collapsed) this.#setCollapsed(true, true);
    else if (!this.#narrow.matches && this.#autoCollapsed && this.collapsed)
      this.#setCollapsed(false);
  };

  override connectedCallback() {
    super.connectedCallback();
    this.#narrow.addEventListener("change", this.#onNarrow);
    if (this.#narrow.matches !== this.#wasNarrow) this.#onNarrow();
    this.#watcher.observe(this, {
      attributes: true,
      subtree: true,
      // Items added to or removed from a section raise no slotchange here.
      childList: true,
      attributeFilter: ["expanded", "selected", "level"],
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#narrow.removeEventListener("change", this.#onNarrow);
    this.#watcher.disconnect();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (!changed.has("collapsed")) return;
    // Any opening, including one the app sets, ends an automatic collapse.
    if (!this.collapsed) this.#autoCollapsed = false;
    // The navigation is about to be hidden; keep focus from falling to the page.
    else if (this.matches(":focus-within"))
      this.shadowRoot?.querySelector<HTMLElement>(".toggle")?.focus();
  }

  #toggleCollapsed = () => this.#setCollapsed(!this.collapsed);

  #setCollapsed(collapsed: boolean, auto = false) {
    this.#autoCollapsed = auto;
    this.collapsed = collapsed;
    this.dispatchEvent(
      new CustomEvent("pl-collapse", {
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
        aria-controls="nav"
        aria-label=${
          this.label && this.toggleLabel === TOGGLE_LABEL
            ? `${this.label} sidebar`
            : this.toggleLabel
        }
        @click=${this.#toggleCollapsed}
      >
        ${sidebarIcon}
      </button>
      <nav
        id="nav"
        part="nav"
        aria-label=${this.label || nothing}
        @click=${this.#onClick}
        @keydown=${this.#onKeydown}
        @pl-toggle=${() => this.#sync()}
      >
        <slot @slotchange=${this.#onSlotchange}></slot>
      </nav>
    `;
  }
}

customElements.define("pl-sidebar", PlSidebar);

declare global {
  interface HTMLElementTagNameMap {
    "pl-sidebar": PlSidebar;
  }
}
