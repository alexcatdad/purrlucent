import { LitElement, html, nothing, svg, type PropertyValues } from "lit";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { PlSidebarItem } from "./sidebar-item.ts";
import { PlSidebarSection } from "./sidebar-section.ts";
import { sidebarStyles } from "./sidebar.css.ts";
import { fill, messages } from "../../behaviors/locale.ts";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { isApple, matchesShortcut } from "./shortcut.ts";

export { PlSidebarItem, PlSidebarSection };

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
 * button. On a narrow screen (`collapse-below`, 600px or less by default) the
 * sidebar collapses on its own; shown again, it is a modal panel on the start
 * edge over a scrim: the page behind is inert, Escape or a press on the scrim
 * closes it, focus moves into it and returns to the toggle. A collapse it made
 * itself is undone when the screen widens; `pl-collapse` also fires for the
 * first one, once the sidebar has rendered. Whether the screen is narrow is
 * decided when the sidebar connects and again at each width change, before the
 * next frame is drawn, so a narrow screen never shows the inline sidebar. While
 * the panel is open the sidebar itself takes no space in the page.
 *
 * Hiding and showing slides the width, with the motion tokens, and does not
 * animate under `prefers-reduced-motion: reduce`; a collapse caused by the
 * screen width is immediate.
 *
 * `collapsed` is the state, and an app can control it: set the property or
 * attribute, or call `toggle()`, `show()` and `hide()`. Setting `collapsed`
 * does not fire `pl-collapse`; the toggle button, the methods, the `shortcut`
 * and the automatic collapse do. With `no-toggle` the built-in button is
 * hidden, for an app that has its own.
 *
 * @attr {boolean} collapsed - The sidebar is hidden, leaving only its toggle, or nothing with `no-toggle`. Set it to control the sidebar; changing it from outside fires no `pl-collapse`.
 * @attr {number} collapse-below - The viewport width in px at and below which the sidebar collapses on its own and opens as a modal panel. `0` turns this off. Defaults to 600.
 * @attr {boolean} no-toggle - Hides the built-in toggle button; a collapsed sidebar then takes no space at all. Open and close the sidebar with `toggle()`, `show()`, `hide()`, `collapsed` or `shortcut`.
 * @attr {boolean} reorderable - Level 1 items show a grip, on hover and keyboard focus or always on a touch screen, and can be moved with a pointer drag or Alt with the Up and Down arrows. The sidebar fires `pl-reorder` on the item and the app moves it.
 * @attr {string} chevron - Where the disclosure chevron of a group sits: `end` (default), after the label and the detail, so icons and labels line up with plain rows, or `start`, before the icon.
 * @attr {string} shortcut - A key combination that toggles the sidebar from anywhere in the page, such as `mod+b`. `mod` is Command on Apple platforms and Control elsewhere; `alt`, `shift` and `ctrl` are also known. A key press needs `mod`, `ctrl` or `alt` to count, so typing is never taken.
 * @attr {string} toggle-label - The toggle button's accessible name. Defaults to the page language's text (see `setMessages`), in English "Sidebar", which becomes "<label> sidebar" when `label` is set.
 * @slot - `pl-sidebar-item` and `pl-sidebar-section` children.
 * @slot header - Content pinned above the navigation, such as a logo or the account name. It sits outside the `nav` landmark.
 * @slot footer - Content pinned below the navigation, such as preferences, the signed-in person or a version. It sits outside the `nav` landmark.
 * @csspart toggle - The button that hides and shows the sidebar.
 * @csspart header - The wrapper of the `header` slot.
 * @csspart nav - The navigation landmark.
 * @csspart footer - The wrapper of the `footer` slot.
 * @csspart dialog - The modal panel a narrow screen shows.
 * @fires {CustomEvent<{ selected: PlSidebarItem[] }>} pl-change - The selected item changed. `detail.selected` is an array holding the new item.
 * @fires {CustomEvent<{ collapsed: boolean }>} pl-collapse - The sidebar was hidden or shown by its toggle, a method, the shortcut, Escape or the scrim, or by the screen width. `detail.collapsed` holds the new state.
 */
export class PlSidebar extends LitElement {
  static override styles = sidebarStyles;
  static override properties = {
    label: { type: String },
    collapsed: { type: Boolean, reflect: true },
    size: { reflect: true },
    toggleLabel: { attribute: "toggle-label" },
    noToggle: { type: Boolean, attribute: "no-toggle", reflect: true },
    reorderable: { type: Boolean, reflect: true },
    chevron: { reflect: true },
    shortcut: {},
    collapseBelow: {
      type: Number,
      attribute: "collapse-below",
      noAccessor: true,
    },
    _narrow: { state: true },
  };

  /** Accessible name of the navigation landmark. */
  declare label: string;
  declare collapsed: boolean;
  /** `md` (default) or `lg`, the larger rows. */
  declare size: "md" | "lg";
  declare toggleLabel: string;
  declare noToggle: boolean;
  declare reorderable: boolean;
  /** `end` (default) or `start`, where a group's disclosure chevron sits. */
  declare chevron: "end" | "start";
  declare shortcut: string;
  declare _narrow: boolean;

  #collapseBelow = 600;

  /** The width in px at and below which the sidebar collapses on its own; 0 turns it off. */
  get collapseBelow(): number {
    return this.#collapseBelow;
  }

  set collapseBelow(value: number | null | undefined) {
    const old = this.#collapseBelow;
    this.#collapseBelow = Number.isFinite(value)
      ? Math.max(0, value as number)
      : 600;
    this.requestUpdate("collapseBelow", old);
    if (this.isConnected) this.#watchNarrow();
  }

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
    this.toggleLabel = "";
    this.noToggle = false;
    this.reorderable = false;
    this.chevron = "end";
    this.shortcut = "";
    this._narrow = false;
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
      item.chevron = this.chevron;
      if (item.level === 1) {
        parent = item;
        const next = items[i + 1];
        item.expandable =
          !item.action &&
          next?.level === 2 &&
          next.parentElement === item.parentElement;
        item.hidden = false;
        item.reorderable = this.reorderable;
        // Its button names the items that follow, which may have changed.
        if (item.expandable) item.requestUpdate();
      } else {
        item.reorderable = false;
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
    if (!(item instanceof PlSidebarItem)) return;
    // A press on the grip only moves the item.
    if (origin instanceof Element && origin.closest("[part=handle]")) return;
    // A modified click opens the link elsewhere; this page stays current.
    const plain =
      event.button === 0 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey;
    // A router can take over a plain click on a link before the browser leaves.
    const link = event
      .composedPath()
      .find(
        (node): node is HTMLAnchorElement =>
          node instanceof HTMLAnchorElement &&
          node.getRootNode() === item.shadowRoot,
      );
    if (
      link &&
      plain &&
      !item.dispatchEvent(
        new CustomEvent("pl-navigate", {
          detail: { href: item.href },
          bubbles: true,
          composed: true,
          cancelable: true,
        }),
      )
    )
      event.preventDefault();
    if (
      item.action ||
      (item.expandable &&
        (!item.href ||
          (origin instanceof Element && origin.closest("button")))) ||
      item.selected ||
      (item.href && !plain)
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
    if (
      this.reorderable &&
      item.level === 1 &&
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      const peers = this.#peers(item);
      const from = peers.indexOf(item);
      const to = from + (event.key === "ArrowUp" ? -1 : 1);
      if (to >= 0 && to < peers.length) {
        this.#reorder(item, from, to);
        // Moving the item in the page drops its focus; an app that renders
        // later than this microtask has moved it by the next frame.
        const refocus = () => {
          if (!item.matches(":focus-within")) item.focus();
        };
        queueMicrotask(refocus);
        requestAnimationFrame(refocus);
      }
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
    // Closing the group is this Escape's whole job: a modal panel stays open.
    event.preventDefault();
    // The button's own handler closes it and fires pl-toggle.
    parent.renderRoot.querySelector("button")?.click();
    parent.focus();
  };

  /** The level 1 items of the item's section, or of the sidebar. */
  #peers(item: PlSidebarItem) {
    return this.#items().filter(
      (peer) => peer.level === 1 && peer.parentElement === item.parentElement,
    );
  }

  #reorder(item: PlSidebarItem, from: number, to: number) {
    item.dispatchEvent(
      new CustomEvent("pl-reorder", {
        detail: { from, to },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #drag?: {
    item: PlSidebarItem;
    peers: PlSidebarItem[];
    from: number;
    to: number;
    y: number;
    min: number;
    max: number;
  };

  #onPointerdown = (event: PointerEvent) => {
    const item = event.target;
    const origin = event.composedPath()[0];
    const grip = origin instanceof Element && origin.closest("[part=handle]");
    if (
      !this.reorderable ||
      !grip ||
      !(item instanceof PlSidebarItem) ||
      item.level !== 1 ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    const peers = this.#peers(item);
    const from = peers.indexOf(item);
    grip.setPointerCapture(event.pointerId);
    // The item stays inside the navigation, so the drag never grows its scroll area.
    const box = item.getBoundingClientRect();
    const nav = this.renderRoot.querySelector("nav")?.getBoundingClientRect();
    this.#drag = {
      item,
      peers,
      from,
      to: from,
      y: event.clientY,
      // The start position is always in range, even for an item partly
      // scrolled out of the nav or taller than it.
      min: nav ? Math.min(0, nav.top - box.top) : -Infinity,
      max: nav ? Math.max(0, nav.bottom - box.bottom) : Infinity,
    };
    item.toggleAttribute("data-dragging", true);
    // Keeps the press from selecting text or starting a native drag.
    event.preventDefault();
  };

  #onPointermove = (event: PointerEvent) => {
    const drag = this.#drag;
    if (!drag) return;
    const dy = Math.min(Math.max(event.clientY - drag.y, drag.min), drag.max);
    drag.item.style.setProperty("translate", `0 ${dy}px`);
    // Its place is the number of other items whose middle is above the pointer.
    drag.to = drag.peers.filter((peer) => {
      const box = peer.getBoundingClientRect();
      return peer !== drag.item && box.top + box.height / 2 < event.clientY;
    }).length;
  };

  #onPointerend = (event: PointerEvent) => {
    const drag = this.#drag;
    if (!drag) return;
    this.#drag = undefined;
    drag.item.removeAttribute("data-dragging");
    drag.item.style.removeProperty("translate");
    if (event.type === "pointerup" && drag.to !== drag.from)
      this.#reorder(drag.item, drag.from, drag.to);
  };

  // Narrow screen, any pointer: the sidebar collapses on its own, so the app's
  // own navigation (a bottom tab bar is preferred) takes over.
  #narrow?: MediaQueryList;

  // A collapse the sidebar made itself is undone when the screen widens again;
  // one the person or the app made, or undid, is theirs to keep.
  #autoCollapsed = false;
  // The screen width last acted on, so a move in the page changes nothing but
  // a crossing while detached is caught on reconnect.
  #wasNarrow?: boolean;

  #watchNarrow() {
    this.#narrow?.removeEventListener("change", this.#onNarrow);
    this.#narrow =
      this.#collapseBelow > 0
        ? matchMedia(`(max-width: ${this.#collapseBelow}px)`)
        : undefined;
    this.#narrow?.addEventListener("change", this.#onNarrow);
    this.#onNarrow();
  }

  #onNarrow = () => {
    const narrow = this.#narrow?.matches ?? false;
    if (narrow === this.#wasNarrow) return;
    const first = this.#wasNarrow === undefined;
    this.#wasNarrow = narrow;
    // The change applies to the host in this task, before the next frame is
    // drawn, and without the collapse animation: a narrow screen never shows
    // the full-width sidebar, not even while it shrinks.
    if (!first) this.#snap();
    if (!narrow) this.#closePanel();
    this._narrow = narrow;
    // A listener added after the element connected still hears the first one.
    if (narrow && !this.collapsed) this.#setCollapsed(true, true, first);
    else if (!narrow && this.#autoCollapsed && this.collapsed)
      this.#setCollapsed(false);
    else this.#applyHostState();
  };

  /** Switches the collapse animation off until the change has been drawn. */
  #snap() {
    this.toggleAttribute("data-snap", true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => this.removeAttribute("data-snap")),
    );
  }

  /** The attributes the styles read, set now rather than at the next update. */
  #applyHostState() {
    this.toggleAttribute("collapsed", this.collapsed);
    this.toggleAttribute("data-overlay", this.#overlay);
  }

  /**
   * Closes an open modal panel before the render removes it. Removing an open
   * modal dialog leaves the page inert and the engines restore focus on their
   * own schedule, so the toggle is focused only afterwards, in `updated()`.
   */
  #closePanel() {
    const dialog = this.shadowRoot?.querySelector("dialog");
    if (!dialog?.open) return;
    // WebKit does not focus a clicked button, so a press on the scrim or the
    // panel's toggle can leave focus on the page: it still belongs back here.
    const active = document.activeElement;
    if (this.matches(":focus-within") || !active || active === document.body)
      this.#refocus = true;
    dialog.close();
  }

  readonly #onShortcut = (event: KeyboardEvent) => {
    if (
      !this.shortcut ||
      event.defaultPrevented ||
      event.repeat ||
      event.isComposing ||
      // A bare character key would swallow typing.
      !(event.ctrlKey || event.metaKey || event.altKey) ||
      !matchesShortcut(event, this.shortcut, isApple())
    )
      return;
    event.preventDefault();
    this.toggle();
  };

  override connectedCallback() {
    super.connectedCallback();
    this.#watchNarrow();
    document.addEventListener("keydown", this.#onShortcut);
    // A native modal dialog leaves the top layer when its host is moved.
    const dialog = this.shadowRoot?.querySelector("dialog");
    if (dialog?.open) {
      dialog.close();
      this.requestUpdate();
    }
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
    this.#narrow?.removeEventListener("change", this.#onNarrow);
    document.removeEventListener("keydown", this.#onShortcut);
    this.#watcher.disconnect();
  }

  /** Hides the sidebar when it is shown, and shows it when it is hidden. Fires `pl-collapse`. */
  toggle() {
    this.#setCollapsed(!this.collapsed);
  }

  /** Shows the sidebar. Fires `pl-collapse` when it was hidden. */
  show() {
    if (this.collapsed) this.#setCollapsed(false);
  }

  /** Hides the sidebar. Fires `pl-collapse` when it was shown. */
  hide() {
    if (!this.collapsed) this.#setCollapsed(true);
  }

  /** A narrow screen shows the open sidebar as a modal panel. */
  get #overlay() {
    return this._narrow && !this.collapsed;
  }

  #wasOverlay = false;
  // Focus goes back to the toggle, or to what had it before the panel opened.
  #refocus = false;
  #opener?: HTMLElement | null;

  protected override willUpdate(changed: PropertyValues<this>) {
    const overlay = this.#overlay;
    this.toggleAttribute("data-overlay", overlay);
    // Any opening, including one the app sets, ends an automatic collapse.
    if (changed.has("collapsed") && !this.collapsed)
      this.#autoCollapsed = false;
    // The navigation is about to be hidden; keep focus from falling to the page.
    if (
      this.matches(":focus-within") &&
      ((changed.has("collapsed") && this.collapsed) ||
        (this.#wasOverlay && !overlay))
    )
      this.#refocus = true;
    this.#wasOverlay = overlay;
    if (changed.has("reorderable") || changed.has("chevron")) this.#sync();
  }

  protected override updated() {
    const dialog = this.shadowRoot?.querySelector("dialog");
    if (dialog && !dialog.open) {
      this.#opener = document.activeElement as HTMLElement | null;
      dialog.showModal();
      const items = this.#items().filter((item) => !item.hidden);
      (items.find((item) => item.selected) ?? items[0])?.focus();
    }
    if (this.#refocus) {
      this.#refocus = false;
      const opener = this.#opener;
      this.#opener = undefined;
      const target = () =>
        this.shadowRoot?.querySelector<HTMLElement>(
          ".toggle:not(.in-dialog)",
        ) ?? opener;
      // After this update has settled and the closed dialog has let go of
      // focus; once more a frame later for an engine that restores it late.
      void this.updateComplete.then(() => {
        target()?.focus();
        requestAnimationFrame(() => {
          if (!target()?.matches(":focus")) target()?.focus();
        });
      });
    }
  }

  #toggleCollapsed = () => this.toggle();

  #setCollapsed(collapsed: boolean, auto = false, deferEvent = false) {
    this.#autoCollapsed = auto;
    if (collapsed) this.#closePanel();
    this.collapsed = collapsed;
    this.#applyHostState();
    const emit = () =>
      this.dispatchEvent(
        new CustomEvent("pl-collapse", {
          detail: { collapsed: this.collapsed },
          bubbles: true,
          composed: true,
        }),
      );
    if (deferEvent) void this.updateComplete.then(emit);
    else emit();
  }

  // Escape closes the panel; the sidebar's own state follows.
  #onCancel = (event: Event) => {
    event.preventDefault();
    this.hide();
  };

  // The panel fills the dialog, so a press on the dialog itself is the scrim.
  // A drag that starts in the panel and ends on the scrim is not a press on it.
  #scrimPress = false;
  #onScrimDown = (event: PointerEvent) => {
    this.#scrimPress = event.target === event.currentTarget;
  };

  #onScrim = (event: MouseEvent) => {
    if (this.#scrimPress && event.target === event.currentTarget) this.hide();
    this.#scrimPress = false;
  };

  #toggleButton(inDialog: boolean) {
    return this.noToggle
      ? nothing
      : html`<button
          class=${inDialog ? "toggle in-dialog" : "toggle"}
          part="toggle"
          type="button"
          aria-expanded=${this.collapsed ? "false" : "true"}
          aria-controls="nav"
          aria-label=${
            this.toggleLabel ||
            (this.label
              ? fill(messages(this).sidebarFor, { label: this.label })
              : messages(this).sidebar)
          }
          @click=${this.#toggleCollapsed}
        >
          ${sidebarIcon}
        </button>`;
  }

  // The header and footer are outside the landmark: they hold the app's own
  // logo, preferences and account, not navigation.
  #content() {
    return html`
      <div part="header" hidden>
        <slot name="header" @slotchange=${hideWhenEmpty}></slot>
      </div>
      <nav
        id="nav"
        part="nav"
        aria-label=${this.label || nothing}
        @click=${this.#onClick}
        @keydown=${this.#onKeydown}
        @pointerdown=${this.#onPointerdown}
        @pointermove=${this.#onPointermove}
        @pointerup=${this.#onPointerend}
        @pointercancel=${this.#onPointerend}
        @pl-toggle=${() => this.#sync()}
      >
        <slot @slotchange=${this.#onSlotchange}></slot>
      </nav>
      <div part="footer" hidden>
        <slot name="footer" @slotchange=${hideWhenEmpty}></slot>
      </div>
    `;
  }

  override render() {
    return html`${this.#toggleButton(false)}${
      this.#overlay
        ? html`<dialog
            part="dialog"
            aria-label=${this.label || messages(this).sidebar}
            @cancel=${this.#onCancel}
            @pointerdown=${this.#onScrimDown}
            @click=${this.#onScrim}
          >
            <div class="panel">
              ${this.#toggleButton(true)}${this.#content()}
            </div>
          </dialog>`
        : this.#content()
    }`;
  }
}

customElements.define("pl-sidebar", PlSidebar);

declare global {
  interface HTMLElementTagNameMap {
    "pl-sidebar": PlSidebar;
  }
}
