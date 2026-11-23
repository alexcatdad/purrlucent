import { LitElement, html, type PropertyValues } from "lit";
import { fireNative } from "../../behaviors/native-events.ts";
import { nativeMessage } from "../../behaviors/native-message.ts";
import { PressableController } from "../../behaviors/pressable.ts";
import { RovingFocusController } from "../../behaviors/roving-focus.ts";
import { SelectionController } from "../../behaviors/selection.ts";
import { boxStyles } from "../checkbox/checkbox.css.ts";
import { groupStyles, radioStyles } from "./radio-group.css.ts";

/** Keys the roving focus controller handles: only these choose a radio on keydown. */
const MOVES = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

/**
 * One choice in a `pl-radio-group`. The slotted text is its label and
 * accessible name.
 *
 * @attr {string} value - The value the group reports when this radio is chosen.
 * @attr {boolean} checked - Marks the starting choice. After that the group owns it, and a form reset returns to it.
 * @attr {boolean} disabled - This radio takes no focus and cannot be chosen. A disabled group disables all.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @slot - The label.
 * @csspart box - The drawn circle.
 * @csspart label - The wrapper around the label.
 */
export class PlRadio extends LitElement {
  static override styles = [boxStyles, radioStyles];
  static override properties = {
    value: { reflect: true },
    checked: { type: Boolean },
    size: { reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare checked: boolean;
  declare size: "md" | "lg" | "xl";
  declare disabled: boolean;

  // Space chooses a radio; Enter does not, as with a native radio.
  readonly pressable = new PressableController(this, {
    disabled: () => this.#off,
    enter: false,
  });
  readonly #internals = this.pressable.internals;

  constructor() {
    super();
    this.value = "";
    this.checked = false;
    this.size = "md";
    this.disabled = false;
  }

  get #group() {
    return this.closest("pl-radio-group");
  }

  get #off() {
    return this.disabled || (this.#group?.matches(":disabled") ?? false);
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "radio");
  }

  #state(name: string, on: boolean) {
    if (on) this.#internals.states.add(name);
    else this.#internals.states.delete(name);
  }

  protected override updated(changed: PropertyValues<this>) {
    const off = this.#off;
    this.setAttribute("aria-checked", String(this.checked));
    if (off) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    // A disabled radio takes no focus, not even from a click.
    if (off) this.removeAttribute("tabindex");
    this.#state("checked", this.checked);
    this.#state("disabled", off);
    // The group picks the tab stop among the enabled radios.
    // A later `value` change re-derives which radio is checked.
    if (changed.has("disabled") || changed.get("value") !== undefined)
      this.#group?.requestUpdate();
  }

  #onSlotChange = (event: Event) => {
    this.#state(
      "labelled",
      (event.target as HTMLSlotElement)
        .assignedNodes()
        .some((node) => node.textContent?.trim()),
    );
  };

  override render() {
    return html`<span part="box"
        ><svg viewBox="0 0 24 24" aria-hidden="true">
          <circle class="dot" cx="12" cy="12" r="3.6" /></svg></span
      ><span part="label"
        ><slot @slotchange=${this.#onSlotChange}></slot
      ></span>`;
  }
}

/**
 * A set of radios that offers one choice, as a native radio group does. Tab
 * enters on the chosen radio, else on the first enabled one. Arrow keys move
 * focus and choose, wrap, and follow the visual direction under `dir="rtl"`;
 * Space chooses the focused radio. The group is the form control: it submits
 * `name` with the chosen `value`, a form reset returns to the radio marked
 * `checked`, and a disabled fieldset disables it. Always set `label`: without
 * it the group has no accessible name.
 *
 * @attr {string} value - The value of the chosen radio. Empty when none is.
 * @attr {string} label - The accessible name of the group. Required.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} orientation - `vertical` (default) or `horizontal`.
 * @attr {boolean} required - The form is invalid while no radio is chosen.
 * @attr {boolean} disabled - Disables every radio: no focus, no feedback, nothing submitted.
 * @slot - `pl-radio` elements.
 * @fires {CustomEvent<{ selected: string[] }>} pl-change - The user chose a radio. `detail.selected` is a one-item array of its value.
 * @fires input - After pl-change, as a native radio fires it.
 * @fires change - After input, as a native radio fires it.
 */
export class PlRadioGroup extends LitElement {
  static formAssociated = true;
  static override styles = groupStyles;
  static override properties = {
    value: {},
    label: {},
    name: { reflect: true },
    orientation: { reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare label: string;
  declare name: string;
  declare orientation: "vertical" | "horizontal";
  declare required: boolean;
  declare disabled: boolean;

  readonly #internals = this.attachInternals();
  readonly #selection = new SelectionController<string>(this, {
    mode: "single",
    required: false,
  });
  // The enabled radios take part in arrow keys and the tab stop.
  readonly #roving = new RovingFocusController(this, {
    items: () => this.#enabled,
    orientation: "horizontal",
    wrap: true,
  });
  #radios: PlRadio[] = [];
  /** True while the selection is synced from `value`: not a user change. */
  #syncing = false;

  constructor() {
    super();
    this.value = "";
    this.label = "";
    this.name = "";
    this.orientation = "vertical";
    this.required = false;
    this.disabled = false;
    this.addEventListener("pl-change", (event) => {
      if (this.#syncing) return event.stopImmediatePropagation();
      const [selected] = (event as CustomEvent<{ selected: string[] }>).detail
        .selected;
      if (selected !== undefined) this.value = selected;
    });
    this.addEventListener("pl-press", (event) => {
      if (event.target instanceof PlRadio) this.#choose(event.target.value);
    });
  }

  /** The user's choice; the native events follow pl-change, as on a native radio. */
  #choose(value: string) {
    const before = this.value;
    this.#selection.select(value);
    if (this.value !== before) fireNative(this, "input", "change");
  }

  get #enabled() {
    return this.#radios.filter(
      (r) => !r.disabled && !this.matches(":disabled"),
    );
  }

  /** The value of the radio marked `checked` in the markup. */
  get #initial() {
    return this.#radios.find((r) => r.hasAttribute("checked"))?.value ?? "";
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

  formResetCallback() {
    this.value = this.#initial;
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  /**
   * A key that moved focus also chooses the radio that now has it. Up and
   * Down move like Left and Right; the roving focus controller only handles
   * the horizontal arrows.
   */
  #onKeydown = (event: KeyboardEvent) => {
    const enabled = this.#enabled;
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step && !(event.altKey || event.ctrlKey || event.metaKey)) {
      const from = enabled.indexOf(event.target as PlRadio);
      if (from < 0) return;
      event.preventDefault();
      enabled[(from + step + enabled.length) % enabled.length]!.focus();
    } else if (!event.defaultPrevented || !MOVES.has(event.key)) return;
    const focused = enabled.find((r) => r.matches(":focus"));
    if (focused) this.#choose(focused.value);
  };

  #onSlotChange = (event: Event) => {
    this.#radios = (event.target as HTMLSlotElement)
      .assignedElements()
      .filter((el): el is PlRadio => el instanceof PlRadio);
    if (!this.value) this.value = this.#initial;
    this.requestUpdate();
  };

  protected override willUpdate() {
    const chosen = [...this.#selection.selected];
    if (chosen.length === 1 && chosen[0] === this.value) return;
    this.#syncing = true;
    for (const old of chosen) this.#selection.toggle(old);
    if (this.value) this.#selection.select(this.value);
    this.#syncing = false;
  }

  protected override updated(changed: PropertyValues<this>) {
    const disabled = this.matches(":disabled");
    this.#radios.forEach((r) => {
      // A radio without a value is never the choice: "" means none.
      r.checked = this.value !== "" && r.value === this.value;
      r.requestUpdate();
    });
    this.#roving.activate(this.#enabled.findIndex((r) => r.checked));
    if (disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    if (this.required) this.setAttribute("aria-required", "true");
    else this.removeAttribute("aria-required");
    // Only a label that was cleared removes the name; a consumer's own aria-label stays.
    if (this.label) this.setAttribute("aria-label", this.label);
    else if (changed.get("label")) this.removeAttribute("aria-label");
    this.#internals.setFormValue(this.value || null);
    // The host takes no focus, so a failed submit focuses the first radio.
    this.#internals.setValidity(
      { valueMissing: this.required && !this.value },
      nativeMessage("radio", "Choose one of these options to continue."),
      this.#enabled[0],
    );
  }

  override render() {
    return html`<slot @slotchange=${this.#onSlotChange}></slot>`;
  }
}

customElements.define("pl-radio", PlRadio);
customElements.define("pl-radio-group", PlRadioGroup);

declare global {
  interface HTMLElementTagNameMap {
    "pl-radio": PlRadio;
    "pl-radio-group": PlRadioGroup;
  }
}
