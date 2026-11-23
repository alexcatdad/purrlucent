import { LitElement, html, type PropertyValues } from "lit";
import { interactionStyles } from "../../behaviors/interaction.css.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import { PressableController } from "../../behaviors/pressable.ts";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { SelectionController } from "../../behaviors/selection.ts";
import { pickValue } from "./pick-value.ts";
import { groupStyles, itemStyles } from "./toggle-group.css.ts";

/**
 * One choice in a `pl-toggle-group`. The slot holds a text label or an svg
 * icon. An icon-only item needs an `aria-label` to be named; mark the svg
 * `aria-hidden="true"`. Use text or icons in one control, not both.
 *
 * @attr {string} value - The value the group reports when this item is selected.
 * @attr {boolean} selected - Marks the starting selection. After that the group owns it.
 * @attr {boolean} disabled - This item takes no focus and cannot be selected. A disabled group disables all.
 * @slot - The item's text label or svg icon.
 * @csspart label - The wrapper around the label.
 */
export class PlToggleGroupItem extends LitElement {
  static override styles = [interactionStyles, itemStyles];
  static override properties = {
    value: { type: String, reflect: true },
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };
  declare value: string;
  declare selected: boolean;
  declare disabled: boolean;
  // Space selects an item; Enter does not, as with a native radio.
  readonly pressable = new PressableController(this, {
    disabled: () => this.#off,
    enter: false,
  });

  constructor() {
    super();
    this.value = "";
    this.selected = false;
    this.disabled = false;
  }

  /** Disabled on its own or through its group. */
  get #off(): boolean {
    const group = this.closest("pl-toggle-group");
    return (
      this.disabled ||
      (group?.disabled ?? false) ||
      (group?.matches(":disabled") ?? false)
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "radio");
  }

  protected override updated(changed: PropertyValues<this>) {
    const off = this.#off;
    this.setAttribute("aria-checked", String(this.selected));
    if (off) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    // A disabled item takes no focus, not even from a click.
    if (off) this.removeAttribute("tabindex");
    if (off) this.pressable.internals.states.add("disabled");
    else this.pressable.internals.states.delete("disabled");
    // The group picks the tab stop among the enabled items.
    if (changed.has("disabled"))
      this.closest("pl-toggle-group")?.requestUpdate();
  }

  override render() {
    return html`<span part="label"><slot></slot></span>`;
  }
}

/**
 * A row of equal-width items that offers one required choice, as a radio
 * group. Arrow keys, Home and End move focus and select; they follow the visual
 * direction under `dir="rtl"`. Space, Tab and the arrows follow the APG radio
 * group pattern; Home and End are extras. Enter does not select, as with a
 * native radio. Always set `label` (or `aria-label`): without either the group
 * has no accessible name. It takes part in forms like a radio group: it
 * submits `name` with the selected value, a form reset returns it to its
 * starting selection, and a disabled fieldset disables it.
 *
 * @attr {string} value - The value of the selected item. Defaults to the item marked `selected`, else the first.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} label - The accessible name of the group.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {boolean} disabled - Disables the whole group: no focus, no feedback, nothing submitted. To disable one item, set `disabled` on that item; arrows and Tab skip it.
 * @slot - `pl-toggle-group-item` elements.
 * @fires pl-change - The selection changed by the user. `detail.selected` is a one-item array.
 * @fires input - After pl-change, as a native radio fires it.
 * @fires change - After input, as a native radio fires it.
 */
export class PlToggleGroup extends LitElement {
  static formAssociated = true;
  static override styles = [groupStyles];
  static override properties = {
    value: { type: String, reflect: true },
    name: { reflect: true },
    label: { type: String },
    size: { reflect: true },
    disabled: { type: Boolean, reflect: true },
  };
  declare value: string;
  declare name: string;
  declare label: string;
  declare size: "md" | "lg" | "xl";
  declare disabled: boolean;
  readonly #internals = this.attachInternals();
  readonly #selection = new SelectionController<string>(this, {
    mode: "single",
    required: true,
  });
  // The enabled items take part in arrow keys and the tab stop.
  readonly #roving = new RovingFocusController(this, {
    items: () => this.#enabled,
    orientation: "horizontal",
    wrap: true,
  });
  #items: PlToggleGroupItem[] = [];
  /** True while the selection is synced from `value`: not a user change. */
  #syncing = false;
  /** The selection a form reset returns to: the first one the group settled on. */
  #initial: string | undefined;
  /** ARIA attributes the group wrote itself, so it never removes a consumer's. */
  readonly #owned = new Set<string>();

  constructor() {
    super();
    this.value = "";
    this.name = "";
    this.label = "";
    this.size = "md";
    this.disabled = false;
    this.addEventListener("pl-change", (event) => {
      if (this.#syncing) return event.stopImmediatePropagation();
      const [selected] = (event as CustomEvent<{ selected: string[] }>).detail
        .selected;
      if (selected !== undefined) this.value = selected;
    });
    this.addEventListener("pl-press", (event) => {
      if (!this.#off && event.target instanceof PlToggleGroupItem)
        this.#choose(event.target.value);
    });
  }

  /** The user's choice; the native events follow pl-change, as on a native radio. */
  #choose(value: string) {
    const before = this.value;
    this.#selection.select(value);
    if (this.value !== before) fireNative(this, "input", "change");
  }

  // :disabled covers a disabled fieldset around the group; the property is
  // current before the attribute is reflected.
  get #off() {
    return this.disabled || this.matches(":disabled");
  }

  get #enabled() {
    return this.#off ? [] : this.#items.filter((s) => !s.disabled);
  }

  /** Sets an attribute the group owns, and removes it only if the group set it. */
  #own(name: string, value: string | null) {
    if (value !== null) {
      this.setAttribute(name, value);
      this.#owned.add(name);
    } else if (this.#owned.delete(name)) this.removeAttribute(name);
  }

  formResetCallback() {
    if (this.#initial !== undefined) this.value = this.#initial;
  }

  formDisabledCallback() {
    this.requestUpdate();
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
    if (this.#off) return;
    const enabled = this.#enabled;
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step && !(event.altKey || event.ctrlKey || event.metaKey)) {
      const from = enabled.indexOf(event.target as PlToggleGroupItem);
      if (from < 0) return;
      event.preventDefault();
      enabled[(from + step + enabled.length) % enabled.length]!.focus();
    } else if (!event.defaultPrevented) return;
    const focused = enabled.find((s) => s.matches(":focus"));
    if (focused) this.#choose(focused.value);
  };

  #onSlotChange = (event: Event) => {
    this.#items = (event.target as HTMLSlotElement)
      .assignedElements()
      .filter((el): el is PlToggleGroupItem => el instanceof PlToggleGroupItem);
    this.requestUpdate();
  };

  protected override willUpdate() {
    const value = pickValue(this.#items, this.value);
    if (value === undefined) return;
    this.value = value;
    this.#initial ??= value;
    if (!this.#selection.selected.has(value)) {
      this.#syncing = true;
      this.#selection.select(value);
      this.#syncing = false;
    }
  }

  protected override updated() {
    const off = this.#off;
    this.#items.forEach((s, i) => {
      s.selected = s.value === this.value;
      s.toggleAttribute(
        "data-after-selected",
        this.#items[i - 1]?.value === this.value,
      );
      // The item reads the group's state for its own focus and feedback.
      s.requestUpdate();
    });
    // The tab stop is the selected item, or the first enabled one.
    const enabled = this.#enabled;
    this.#roving.activate(
      Math.max(
        0,
        enabled.findIndex((s) => s.selected),
      ),
    );
    this.#own("aria-disabled", off ? "true" : null);
    this.#own("aria-label", this.label || null);
    this.#internals.setFormValue(off ? null : this.value || null);
  }

  override render() {
    return html`<slot @slotchange=${this.#onSlotChange}></slot>`;
  }
}

customElements.define("pl-toggle-group-item", PlToggleGroupItem);
customElements.define("pl-toggle-group", PlToggleGroup);

declare global {
  interface HTMLElementTagNameMap {
    "pl-toggle-group-item": PlToggleGroupItem;
    "pl-toggle-group": PlToggleGroup;
  }
}
