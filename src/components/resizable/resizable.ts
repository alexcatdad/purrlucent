import { LitElement, html, type PropertyValues } from "lit";
import { PlResizableHandle } from "./resizable-handle.ts";
import { PlResizablePanel } from "./resizable-panel.ts";
import {
  collapseAt,
  expandAt,
  initialSizes,
  resizePair,
  rounded,
  span,
} from "./resizable-math.ts";
import { resizableStyles } from "./resizable.css.ts";

export { PlResizableHandle, PlResizablePanel };

// Percent moved by one arrow key press.
const STEP = 1;

/**
 * Panels that people resize by dragging the dividers between them: a split
 * view. Put `pl-resizable-panel` children in the group with a
 * `pl-resizable-handle` between each two. Sizes are percentages that add up to
 * 100, each held within its panel's `min` and `max`. Each divider is a window
 * splitter (WAI-ARIA): arrow keys along the group's axis move it by one
 * percent, Home and End move it to the smallest and largest size the panel
 * before it may take, and Enter collapses a `collapsible` panel next to it or
 * restores a collapsed one. A divider next to a collapsed panel moves nothing
 * until that panel is restored. Give the group a definite size along its axis;
 * it has none of its own.
 *
 * @attr {string} orientation - `horizontal` (default) puts the panels side by side, `vertical` stacks them.
 * @slot - `pl-resizable-panel` and `pl-resizable-handle` children.
 * @fires {CustomEvent<{ sizes: number[] }>} pl-resize - A person moved a divider, or collapsed or restored a panel. `detail.sizes` holds every panel's new size in percent, in order, 0 for a collapsed panel. Setting `sizes`, `collapsed` or a panel's attributes from script fires nothing.
 */
export class PlResizable extends LitElement {
  static override styles = resizableStyles;
  static override properties = { orientation: { reflect: true } };

  declare orientation: "horizontal" | "vertical";

  #panels: PlResizablePanel[] = [];
  // Each divider with the panel before it and the panel after it.
  readonly #links = new Map<
    PlResizableHandle,
    [PlResizablePanel, PlResizablePanel]
  >();
  #sizes: number[] = [];
  #closed = new Set<PlResizablePanel>();
  // The size a collapsed panel returns to.
  readonly #restore = new WeakMap<PlResizablePanel, number>();
  #drag?: {
    handle: PlResizableHandle;
    i: number;
    sizes: number[];
    from: number;
    total: number;
  };
  // A panel's `collapsed` was set from outside.
  readonly #watcher = new MutationObserver(() => this.#syncCollapsed());

  constructor() {
    super();
    this.orientation = "horizontal";
    this.addEventListener("keydown", this.#onKeyDown);
    this.addEventListener("pointerdown", this.#onPointerDown);
    this.addEventListener("pointermove", this.#onPointerMove);
    this.addEventListener("pointerup", this.#endDrag);
    this.addEventListener("pointercancel", this.#endDrag);
  }

  /** Every panel's size in percent, in order, 0 for a collapsed panel. Setting it lays the panels out again. */
  get sizes(): number[] {
    return rounded(this.#sizes);
  }

  set sizes(next: number[]) {
    // From the children, not #panels: this may run before the first slotchange,
    // which then lays the panels out from these attributes.
    [...this.children]
      .filter((child) => child instanceof PlResizablePanel)
      .forEach((panel, i) => {
        const size = next[i];
        if (size === undefined) return;
        // 0 is a collapsed panel; it keeps its size to return to.
        panel.collapsed = size <= 0;
        if (size > 0) panel.size = size;
      });
    this.#reset();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#watcher.observe(this, {
      attributes: true,
      subtree: true,
      attributeFilter: ["collapsed"],
    });
  }

  // A drag cannot outlive the element: its pointer release no longer arrives.
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watcher.disconnect();
    this.#endDrag();
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has("orientation")) this.#paint();
  }

  get #vertical() {
    return this.orientation === "vertical";
  }

  get #limits() {
    return this.#panels.map(({ min, max }) => ({ min, max }));
  }

  /** The panels and dividers, in document order, and the sizes laid out from the panels' own attributes. */
  #onSlotchange = () => {
    const panels: PlResizablePanel[] = [];
    this.#links.clear();
    let handle: PlResizableHandle | undefined;
    for (const child of this.children) {
      if (child instanceof PlResizablePanel) {
        const before = panels.at(-1);
        if (handle && before) this.#links.set(handle, [before, child]);
        handle = undefined;
        panels.push(child);
      } else if (child instanceof PlResizableHandle && panels.length) {
        handle = child;
      }
    }
    if (
      panels.length === this.#panels.length &&
      panels.every((panel, i) => panel === this.#panels[i])
    ) {
      this.#paint();
      return;
    }
    this.#panels = panels;
    this.#reset();
  };

  #reset() {
    for (const panel of this.#panels)
      if (panel.collapsed && panel.size && panel.size > 0)
        this.#restore.set(panel, panel.size);
    this.#closed = new Set(this.#panels.filter((panel) => panel.collapsed));
    this.#sizes = initialSizes(
      this.#panels.map((panel) => ({
        size: panel.size,
        closed: this.#closed.has(panel),
      })),
    );
    this.#paint();
  }

  /** Writes the layout to the panels and the splitter values to the dividers. */
  #paint() {
    this.#panels.forEach((panel, i) => {
      panel.size = this.#sizes[i];
      panel.collapsed = this.#closed.has(panel);
    });
    const limits = this.#limits;
    for (const [handle, [before, after]] of this.#links) {
      const i = this.#panels.indexOf(before);
      const inert = this.#closed.has(before) || this.#closed.has(after);
      const { lo, hi } = inert
        ? { lo: 0, hi: 100 }
        : span(this.#sizes, i, limits);
      handle.orientation = this.orientation;
      handle.setAttribute(
        "aria-orientation",
        this.#vertical ? "horizontal" : "vertical",
      );
      handle.setAttribute("aria-controls", before.id);
      handle.setAttribute("aria-valuenow", String(Math.round(this.#sizes[i]!)));
      handle.setAttribute(
        "aria-valuemin",
        String(before.collapsible ? 0 : Math.round(lo)),
      );
      handle.setAttribute("aria-valuemax", String(Math.round(hi)));
    }
  }

  #emit() {
    this.dispatchEvent(
      new CustomEvent("pl-resize", {
        detail: { sizes: this.sizes },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Takes new sizes from a person's move; tells the app if they differ. */
  #apply(next: number[]) {
    if (next.every((size, i) => size === this.#sizes[i])) return;
    this.#sizes = next;
    this.#paint();
    this.#emit();
  }

  /** Collapses or restores a panel; false when nothing changed (the last open panel stays). */
  #setCollapsed(panel: PlResizablePanel, collapse: boolean) {
    const i = this.#panels.indexOf(panel);
    if (collapse === this.#closed.has(panel) || i < 0) return false;
    let next: number[];
    if (collapse) {
      next = collapseAt(
        this.#sizes,
        this.#panels.map((p) => this.#closed.has(p)),
        i,
      );
      if (next === this.#sizes) {
        this.#paint();
        return false;
      }
      this.#restore.set(panel, this.#sizes[i]!);
      this.#closed.add(panel);
    } else {
      const size =
        this.#restore.get(panel) ??
        Math.min(panel.max, Math.max(panel.min, 100 / this.#panels.length));
      next = expandAt(this.#sizes, i, size);
      this.#closed.delete(panel);
    }
    this.#sizes = next;
    this.#paint();
    return true;
  }

  #syncCollapsed() {
    for (const panel of this.#panels)
      if (panel.collapsed !== this.#closed.has(panel))
        this.#setCollapsed(panel, panel.collapsed);
  }

  #onKeyDown = (event: KeyboardEvent) => {
    const handle = event.target;
    if (
      !(handle instanceof PlResizableHandle) ||
      handle.disabled ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const link = this.#links.get(handle);
    if (!link) return;
    const [before, after] = link;
    if (event.key === "Enter") {
      event.preventDefault();
      const target =
        [before, after].find((panel) => this.#closed.has(panel)) ??
        [before, after].find((panel) => panel.collapsible);
      if (target && this.#setCollapsed(target, !this.#closed.has(target)))
        this.#emit();
      return;
    }
    if (this.#closed.has(before) || this.#closed.has(after)) return;
    const i = this.#panels.indexOf(before);
    // Right grows the first panel in ltr; Down grows it when stacked.
    const rtl = !this.#vertical && getComputedStyle(this).direction === "rtl";
    const grow = this.#vertical
      ? "ArrowDown"
      : rtl
        ? "ArrowLeft"
        : "ArrowRight";
    const shrink = this.#vertical
      ? "ArrowUp"
      : rtl
        ? "ArrowRight"
        : "ArrowLeft";
    const { lo, hi } = span(this.#sizes, i, this.#limits);
    const target =
      event.key === grow
        ? this.#sizes[i]! + STEP
        : event.key === shrink
          ? this.#sizes[i]! - STEP
          : event.key === "Home"
            ? lo
            : event.key === "End"
              ? hi
              : undefined;
    if (target === undefined) return;
    event.preventDefault();
    this.#apply(resizePair(this.#sizes, i, target, this.#limits));
  };

  #onPointerDown = (event: PointerEvent) => {
    const handle = event.target;
    if (
      event.button !== 0 ||
      !(handle instanceof PlResizableHandle) ||
      handle.disabled
    )
      return;
    const link = this.#links.get(handle);
    if (!link || this.#closed.has(link[0]) || this.#closed.has(link[1])) return;
    // The panels' sizes in pixels stand for 100 percent.
    const total = this.#panels.reduce((sum, panel) => {
      const box = panel.getBoundingClientRect();
      return sum + (this.#vertical ? box.height : box.width);
    }, 0);
    if (total <= 0) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    handle.dragging = true;
    handle.focus();
    this.#drag = {
      handle,
      i: this.#panels.indexOf(link[0]),
      sizes: [...this.#sizes],
      from: this.#vertical ? event.clientY : event.clientX,
      total,
    };
  };

  #onPointerMove = (event: PointerEvent) => {
    const drag = this.#drag;
    if (!drag || !drag.handle.hasPointerCapture(event.pointerId)) return;
    const moved = (this.#vertical ? event.clientY : event.clientX) - drag.from;
    const rtl = !this.#vertical && getComputedStyle(this).direction === "rtl";
    const delta = ((rtl ? -moved : moved) / drag.total) * 100;
    // From where the drag began, so a limit reached on the way does not drift.
    this.#apply(
      resizePair(drag.sizes, drag.i, drag.sizes[drag.i]! + delta, this.#limits),
    );
  };

  #endDrag = () => {
    if (this.#drag) this.#drag.handle.dragging = false;
    this.#drag = undefined;
  };

  override render() {
    return html`<slot @slotchange=${this.#onSlotchange}></slot>`;
  }
}

customElements.define("pl-resizable", PlResizable);

declare global {
  interface HTMLElementTagNameMap {
    "pl-resizable": PlResizable;
  }
}
