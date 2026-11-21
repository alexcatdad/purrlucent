import { LitElement, html } from "lit";
import { interactionStyles } from "../../behaviors/interaction.css.ts";
import { PressableController } from "../../behaviors/pressable.ts";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { SelectionController } from "../../behaviors/selection.ts";
import { pickValue } from "./pick-value.ts";
import { groupStyles, itemStyles } from "./toggle-group.css.ts";

/**
 * One choice in a `purr-toggle-group`. The slot holds its text label.
 *
 * @attr {string} value - The value the group reports when this item is selected.
 * @attr {boolean} selected - Marks the starting selection. After that the group owns it.
 * @attr {boolean} disabled - Set by the group from its own `disabled`.
 * @slot - The item's text label.
 * @csspart label - The wrapper around the label.
 */
export class PurrToggleGroupItem extends LitElement {
  static override styles = [interactionStyles, itemStyles];
  static override properties = {
    value: { type: String, reflect: true },
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };
  declare value: string;
  declare selected: boolean;
  declare disabled: boolean;
  readonly pressable = new PressableController(this, {
    disabled: () => this.disabled,
  });

  constructor() {
    super();
    this.value = "";
    this.selected = false;
    this.disabled = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "radio");
  }

  protected override updated() {
    this.setAttribute("aria-checked", String(this.selected));
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
  }

  override render() {
    return html`<span part="label"><slot></slot></span>`;
  }
}

/**
 * A row of equal-width items that offers one required choice, as a radio
 * group. Arrow keys, Home and End move focus and select; they follow the visual
 * direction under `dir="rtl"`. Enter also selects the focused item. Space,
 * Tab and the arrows follow the APG radio group pattern; Enter, Home and End
 * are extras. Always set `label`: without it the group has no accessible name.
 *
 * @attr {string} value - The value of the selected item. Defaults to the item marked `selected`, else the first.
 * @attr {string} label - The accessible name of the group. Required.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {boolean} disabled - Disables the whole group: no focus, no feedback.
 * @slot - `purr-toggle-group-item` elements.
 * @fires purr-change - The selection changed by the user. `detail.selected` is a one-item array.
 */
export class PurrToggleGroup extends LitElement {
  static override styles = [groupStyles];
  static override properties = {
    value: { type: String, reflect: true },
    label: { type: String },
    size: { reflect: true },
    disabled: { type: Boolean, reflect: true },
  };
  declare value: string;
  declare label: string;
  declare size: "md" | "lg" | "xl";
  declare disabled: boolean;
  readonly #selection = new SelectionController<string>(this, {
    mode: "single",
    required: true,
  });
  readonly #roving = new RovingFocusController(this, {
    items: () => this.#items,
    orientation: "horizontal",
    wrap: true,
  });
  #items: PurrToggleGroupItem[] = [];
  /** True while the selection is synced from `value`: not a user change. */
  #syncing = false;

  constructor() {
    super();
    this.value = "";
    this.label = "";
    this.size = "md";
    this.disabled = false;
    this.addEventListener("purr-change", (event) => {
      if (this.#syncing) return event.stopImmediatePropagation();
      const [selected] = (event as CustomEvent<{ selected: string[] }>).detail
        .selected;
      if (selected !== undefined) this.value = selected;
    });
    this.addEventListener("purr-press", (event) => {
      if (event.target instanceof PurrToggleGroupItem)
        this.#selection.select(event.target.value);
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "radiogroup");
    // After the roving focus controller's own keydown listener, so focus has moved.
    this.addEventListener("keydown", this.#onKeydown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.#onKeydown);
  }

  /**
   * A key that moved focus also selects the item that now has it. Up and
   * Down move like Left and Right in a radio group; the roving focus controller
   * only handles the horizontal arrows.
   */
  #onKeydown = (event: KeyboardEvent) => {
    if (this.disabled) return;
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step && !(event.altKey || event.ctrlKey || event.metaKey)) {
      const from = this.#items.indexOf(event.target as PurrToggleGroupItem);
      if (from < 0) return;
      event.preventDefault();
      const count = this.#items.length;
      this.#items[(from + step + count) % count]!.focus();
    } else if (!event.defaultPrevented) return;
    const focused = this.#items.find((s) => s.matches(":focus"));
    if (focused) this.#selection.select(focused.value);
  };

  #onSlotChange = (event: Event) => {
    this.#items = (event.target as HTMLSlotElement)
      .assignedElements()
      .filter(
        (el): el is PurrToggleGroupItem => el instanceof PurrToggleGroupItem,
      );
    this.requestUpdate();
  };

  protected override willUpdate() {
    const value = pickValue(this.#items, this.value);
    if (value === undefined) return;
    this.value = value;
    if (!this.#selection.selected.has(value)) {
      this.#syncing = true;
      this.#selection.select(value);
      this.#syncing = false;
    }
  }

  protected override updated() {
    this.#items.forEach((s, i) => {
      s.selected = s.value === this.value;
      s.disabled = this.disabled;
      s.toggleAttribute(
        "data-after-selected",
        this.#items[i - 1]?.value === this.value,
      );
    });
    this.#roving.activate(this.#items.findIndex((s) => s.selected));
    // A disabled item takes no focus, not even from a click.
    if (this.disabled)
      this.#items.forEach((s) => s.removeAttribute("tabindex"));
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    if (this.label) this.setAttribute("aria-label", this.label);
    else this.removeAttribute("aria-label");
  }

  override render() {
    return html`<slot @slotchange=${this.#onSlotChange}></slot>`;
  }
}

customElements.define("purr-toggle-group-item", PurrToggleGroupItem);
customElements.define("purr-toggle-group", PurrToggleGroup);

declare global {
  interface HTMLElementTagNameMap {
    "purr-toggle-group-item": PurrToggleGroupItem;
    "purr-toggle-group": PurrToggleGroup;
  }
}
