import { LensController } from "../../behaviors/lens.ts";
import { LitElement, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { interactionStyles } from "../../behaviors/interaction.css.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import { PressableController } from "../../behaviors/pressable.ts";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { markScrollEdges } from "../../behaviors/scroll-edges.ts";
import { panelStyles, tabStyles, tabsStyles } from "./tabs.css.ts";

let ids = 0;

/** Gives an element an id when it has none, so tab and panel can name each other. */
const idOf = (el: HTMLElement, prefix: string) =>
  (el.id ||= `${prefix}-${++ids}`);

/**
 * One tab in a `pl-tabs`. The slot holds a short text label, optionally with an
 * svg icon. The tab sets `slot="tab"` on itself, so it joins the tab list
 * without the attribute. Its `value` names the `pl-tab-panel` it shows.
 *
 * @attr {string} value - The value the tabs report when this tab is selected. Matches the `value` of one `pl-tab-panel`.
 * @attr {boolean} disabled - This tab takes no focus and cannot be selected; arrows and Tab skip it.
 * @slot - The tab's text label, optionally with an svg icon.
 * @csspart label - The wrapper around the label.
 */
export class PlTab extends LitElement {
  static override styles = [interactionStyles, tabStyles];
  static override properties = {
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
  };
  declare value: string;
  declare disabled: boolean;
  /** Set by the tabs: the user chooses a tab, they do not set this. */
  declare selected: boolean;
  readonly pressable = new PressableController(this, {
    disabled: () => this.disabled,
  });

  constructor() {
    super();
    this.value = "";
    this.disabled = false;
    this.selected = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "tab");
    if (!this.hasAttribute("slot")) this.setAttribute("slot", "tab");
  }

  protected override updated() {
    this.setAttribute("aria-selected", String(this.selected));
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    if (this.disabled) this.removeAttribute("tabindex");
    if (this.disabled) this.pressable.internals.states.add("disabled");
    else this.pressable.internals.states.delete("disabled");
    // The tabs pick the tab stop among the enabled tabs.
    this.closest("pl-tabs")?.requestUpdate();
  }

  override render() {
    return html`<span part="label"><slot></slot></span>`;
  }
}

/**
 * The content one tab shows. It is visible only while the tab with the same
 * `value` is selected. It is a tab stop, so a keyboard user can move from the
 * tab into the content.
 *
 * @attr {string} value - The value of the `pl-tab` that shows this panel.
 * @slot - The panel's content.
 */
export class PlTabPanel extends LitElement {
  static override styles = [panelStyles];
  static override properties = {
    value: { type: String, reflect: true },
  };
  declare value: string;

  constructor() {
    super();
    this.value = "";
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "tabpanel");
    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    this.closest("pl-tabs")?.requestUpdate();
  }

  override render() {
    return html`<slot></slot>`;
  }
}

/**
 * Tabs switch between panels of content in one place, as the APG tabs pattern
 * with automatic activation: moving focus to a tab shows its panel. Tab enters
 * on the selected tab, and the arrow keys, Home and End move between tabs and
 * wrap. Horizontal tabs use Left and Right (mirrored under `dir="rtl"`);
 * vertical tabs use Up and Down. Always set `label` (or `aria-label`): without
 * either the tab list has no accessible name. Use tabs to switch between panels
 * of one view; to pick a value, use a toggle group, and for the sections of an
 * app use a sidebar.
 *
 * @attr {string} value - The value of the selected tab. Defaults to the first enabled tab; a value no tab has selects the first.
 * @attr {string} orientation - `horizontal` (default) or `vertical`.
 * @attr {string} label - The accessible name of the tab list.
 * @attr {boolean} hide-scrollbar - Hides the scrollbar of a tab list that overflows. The list stays scrollable by touch, wheel and keyboard.
 * @attr {string} variant - `underline` (default): a full-width list with a line under the selected tab. `segmented`: a capsule as wide as its tabs, with the selected tab a raised pill, as in Apple's segmented tab views; it takes glass on a glass page. A segmented list wider than its room scrolls sideways and fades the edges that have more tabs past them.
 * @attr {boolean} stable-height - The panel area keeps the height of the tallest panel, so switching tabs does not move what follows. Every panel stays laid out: the ones not shown are invisible and `inert`, so they take no focus and are not read. Content that grows still resizes the area.
 * @slot - `pl-tab-panel` elements. `pl-tab` elements go in the tab list on their own.
 * @csspart list - The tab list.
 * @csspart panels - The wrapper around the panels.
 * @fires {CustomEvent<{ value: string }>} pl-change - The user selected a tab. `detail.value` is the new value. A change to `value` from code does not fire it.
 * @fires input - After pl-change, as a native control fires it.
 * @fires change - After input, as a native control fires it.
 */
export class PlTabs extends LitElement {
  static override styles = [tabsStyles];
  static override properties = {
    value: { type: String, reflect: true },
    orientation: { reflect: true },
    label: { type: String },
    hideScrollbar: {
      type: Boolean,
      attribute: "hide-scrollbar",
      reflect: true,
    },
    stableHeight: {
      type: Boolean,
      attribute: "stable-height",
      reflect: true,
    },
    variant: { reflect: true },
  };
  declare value: string;
  declare variant: "underline" | "segmented";
  declare hideScrollbar: boolean;
  declare stableHeight: boolean;
  declare orientation: "horizontal" | "vertical";
  declare label: string;
  readonly #roving: RovingFocusController;
  #tabs: PlTab[] = [];
  #panels: PlTabPanel[] = [];
  /** The panels this element made inert, so a page's own inert stays. */
  readonly #inerted = new WeakSet<PlTabPanel>();

  constructor() {
    super();
    new LensController(this, "[part=list]");
    this.value = "";
    this.orientation = "horizontal";
    this.label = "";
    this.hideScrollbar = false;
    this.stableHeight = false;
    this.variant = "underline";
    const vertical = () => this.orientation === "vertical";
    this.#roving = new RovingFocusController(this, {
      items: () => this.#enabled,
      // Read on every key, so a change of orientation applies at once.
      get orientation() {
        return vertical() ? "vertical" : "horizontal";
      },
      wrap: true,
    });
    this.addEventListener("pl-press", (event) => {
      // pl-press is composed: ignore presses from a pl-tabs nested in a panel.
      if (
        event.target instanceof PlTab &&
        event.target.closest("pl-tabs") === this
      )
        this.#choose(event.target.value);
    });
  }

  get #enabled() {
    return this.#tabs.filter((t) => !t.disabled);
  }

  /** The user's choice; the native events follow pl-change. */
  #choose(value: string) {
    if (value === this.value) return;
    this.value = value;
    this.dispatchEvent(
      new CustomEvent("pl-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
    fireNative(this, "input", "change");
  }

  override connectedCallback() {
    super.connectedCallback();
    // After the roving focus controller's own keydown listener, so focus has moved.
    this.addEventListener("keydown", this.#onKeydown);
    // A reconnect does not render again, so the list is observed again here.
    const list = this.renderRoot?.querySelector("[part=list]");
    if (list) this.#resize.observe(list);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.#onKeydown);
    this.#resize.disconnect();
  }

  readonly #resize = new ResizeObserver(() => this.#edges());

  /** A segmented list fades the edges it can scroll toward. */
  #edges = () => {
    const list = this.renderRoot.querySelector("[part=list]");
    if (list) markScrollEdges(list, this.variant === "segmented");
  };

  /** Automatic activation: a key that moved focus selects the tab that now has it. */
  #onKeydown = (event: KeyboardEvent) => {
    if (!event.defaultPrevented) return;
    const focused = this.#enabled.find((t) => t.matches(":focus"));
    if (focused) this.#choose(focused.value);
  };

  #onTabsChange = (event: Event) => {
    this.#tabs = (event.target as HTMLSlotElement)
      .assignedElements()
      .filter((el): el is PlTab => el instanceof PlTab);
    this.requestUpdate();
  };

  #onPanelsChange = (event: Event) => {
    this.#panels = (event.target as HTMLSlotElement)
      .assignedElements()
      .filter((el): el is PlTabPanel => el instanceof PlTabPanel);
    this.requestUpdate();
  };

  protected override willUpdate() {
    if (!this.#tabs.some((t) => t.value === this.value))
      this.value = this.#enabled[0]?.value ?? this.value;
  }

  protected override updated() {
    for (const tab of this.#tabs) {
      tab.selected = tab.value === this.value;
      const panel = this.#panels.find((p) => p.value === tab.value);
      if (!panel) continue;
      tab.setAttribute("aria-controls", idOf(panel, "pl-tab-panel"));
      panel.setAttribute("aria-labelledby", idOf(tab, "pl-tab"));
    }
    // With stable-height every panel keeps its place in the shared cell, so
    // the tallest sets the height; the ones not shown are inert instead.
    for (const panel of this.#panels) {
      const shown = panel.value === this.value;
      panel.hidden = !shown && !this.stableHeight;
      if (!shown && this.stableHeight) {
        if (panel.inert) continue;
        panel.inert = true;
        this.#inerted.add(panel);
      } else if (this.#inerted.delete(panel)) panel.inert = false;
    }
    const list = this.renderRoot.querySelector("[part=list]")!;
    this.#resize.observe(list);
    this.#edges();
    // The tab stop is the selected tab, or the first enabled one.
    this.#roving.activate(
      Math.max(
        0,
        this.#enabled.findIndex((t) => t.selected),
      ),
    );
  }

  override render() {
    // tabindex="-1": Firefox makes a list that scrolls a tab stop of its own,
    // ahead of the tabs. The tabs are the tab stop, and moving between them
    // scrolls the list.
    return html`
      <div
        part="list"
        role="tablist"
        tabindex="-1"
        @scroll=${this.#edges}
        aria-label=${ifDefined(this.label || undefined)}
        aria-orientation=${
          this.orientation === "vertical" ? "vertical" : "horizontal"
        }
      >
        <slot name="tab" @slotchange=${this.#onTabsChange}></slot>
      </div>
      <div part="panels">
        <slot @slotchange=${this.#onPanelsChange}></slot>
      </div>
    `;
  }
}

customElements.define("pl-tab", PlTab);
customElements.define("pl-tab-panel", PlTabPanel);
customElements.define("pl-tabs", PlTabs);

declare global {
  interface HTMLElementTagNameMap {
    "pl-tab": PlTab;
    "pl-tab-panel": PlTabPanel;
    "pl-tabs": PlTabs;
  }
}
