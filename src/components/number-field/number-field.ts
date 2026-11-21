import { LitElement, html, nothing, svg } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { submitImplicitly } from "../input/input.ts";
import { numberFieldStyles } from "./number-field.css.ts";
import {
  parse,
  snap,
  stepBy,
  valueAfterKey,
  type Bounds,
} from "./number-math.ts";

const chevron = (d: string) =>
  svg`<svg viewBox="4 8 16 8" aria-hidden="true"><path d=${d} /></svg>`;

// A held button waits before it repeats, so a plain press steps once.
const REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 70;

// An attribute that is empty or not a number is "not set".
const optionalNumber = {
  fromAttribute: (text: string | null) => {
    const n = parse(text ?? "");
    return n === null || Number.isNaN(n) ? null : n;
  },
};

/**
 * A numeric field with up and down stepper buttons, following the WAI-ARIA
 * spinbutton pattern. ArrowUp and ArrowDown step, PageUp and PageDown step ten
 * times, Home and End go to `min` and `max` when they are set. A typed number
 * is clamped to the range and snapped to the step grid when it is committed
 * (blur or Enter). The stepper buttons are not tab stops, repeat while held
 * and disable at the limits. The slotted text is a visible label; without it,
 * `label` becomes the accessible name. It takes part in forms like a native
 * input: it submits `name` with its value, a reset returns it to its `value`
 * attribute and a disabled fieldset disables it.
 *
 * @attr {number} value - The starting value; empty means no value. The `value` property holds the current number, or null.
 * @attr {number} min - Smallest value.
 * @attr {number} max - Largest value.
 * @attr {number} step - The step, 1 by default. Values snap to the grid that starts at `min` (or 0).
 * @attr {string} label - The accessible name when there is no slotted label.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {string} stepper - `inside` (default) puts the stepper in the field, `outside` beside it.
 * @attr {boolean} required - The form is invalid while the field is empty.
 * @attr {boolean} readonly - The value can be selected but not changed.
 * @attr {boolean} disabled - No focus, nothing submitted.
 * @slot - The visible label.
 * @csspart label - The visible label.
 * @csspart group - The field and the outside stepper.
 * @csspart field - The shell around the input.
 * @csspart control - The native input.
 * @csspart stepper - The two stepper buttons.
 * @csspart increment - The up button.
 * @csspart decrement - The down button.
 * @fires purr-input - The value changed through typing, keys or the buttons. `detail.value` holds the number, or null while the field is empty.
 * @fires purr-change - The value was committed (blur, Enter, keys or buttons). `detail.value` holds it.
 */
export class PurrNumberField extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = numberFieldStyles;
  static override properties = {
    value: { converter: optionalNumber },
    min: { converter: optionalNumber },
    max: { converter: optionalNumber },
    step: { type: Number },
    label: {},
    name: { reflect: true },
    size: { reflect: true },
    stepper: { reflect: true },
    required: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    _labelled: { state: true },
  };

  declare value: number | null;
  declare min: number | null;
  declare max: number | null;
  declare step: number;
  declare label: string | undefined;
  declare name: string;
  declare size: "md" | "lg" | "xl";
  declare stepper: "inside" | "outside";
  declare required: boolean;
  declare readonly: boolean;
  declare disabled: boolean;
  declare _labelled: boolean;

  readonly #internals = this.attachInternals();
  #touched = false;
  // Kept here: the inner input does not exist before the first render.
  #custom = "";
  #timer = 0;
  readonly #labelWatch = new MutationObserver(() => this.#syncLabelled());

  constructor() {
    super();
    // A blocked submit or reportValidity() is an interaction too.
    this.addEventListener("invalid", () => {
      this.#touched = true;
      this.#sync();
    });
    this.value = null;
    this.min = null;
    this.max = null;
    this.step = 1;
    this.name = "";
    this.size = "md";
    this.stepper = "inside";
    this.required = false;
    this.readonly = false;
    this.disabled = false;
    this._labelled = false;
  }

  get #input() {
    return this.renderRoot.querySelector<HTMLInputElement>("input");
  }

  get #bounds(): Bounds {
    return {
      min: this.min ?? undefined,
      max: this.max ?? undefined,
      step: this.step > 0 ? this.step : 1,
    };
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#labelWatch.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.#syncLabelled();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#labelWatch.disconnect();
    this.#release();
  }

  get form() {
    return this.#internals.form;
  }

  get labels() {
    return this.#internals.labels;
  }

  get validity() {
    return this.#internals.validity;
  }

  get validationMessage() {
    return this.#internals.validationMessage;
  }

  get willValidate() {
    return this.#internals.willValidate;
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  setCustomValidity(message: string) {
    this.#custom = message;
    this.#sync();
  }

  formResetCallback() {
    this.#touched = false;
    this.value = optionalNumber.fromAttribute(this.getAttribute("value"));
    this.#showValue();
    this.requestUpdate();
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  formStateRestoreCallback(state: string) {
    this.value = optionalNumber.fromAttribute(state);
    this.#showValue();
  }

  // Lit writes the text only when the number changes, so typed junk would stay.
  #showValue() {
    const input = this.#input;
    if (input) input.value = this.#text;
  }

  // The value is always a finite number on the step grid and inside the range.
  protected override willUpdate() {
    if (this.value !== null)
      this.value = Number.isFinite(this.value)
        ? snap(this.value, this.#bounds)
        : null;
  }

  protected override updated() {
    if (this._labelled) this.#internals.states.add("labelled");
    else this.#internals.states.delete("labelled");
    this.#sync();
  }

  #sync(value = this.value) {
    const input = this.#input;
    if (!input) return;
    input.setCustomValidity(this.#custom);
    const invalid = this.#touched && !input.validity.valid;
    this.#internals.setFormValue(value === null ? "" : String(value));
    this.#internals.setValidity(input.validity, input.validationMessage, input);
    if (invalid) this.#internals.states.add("user-invalid");
    else this.#internals.states.delete("user-invalid");
    if (invalid) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  #emit(name: "purr-input" | "purr-change", value = this.value) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  get #text() {
    return this.value === null ? "" : String(this.value);
  }

  /** Takes the typed text as the value; text that is not a number is dropped. */
  #commit() {
    const input = this.#input!;
    const typed = parse(input.value);
    const next =
      typed === null
        ? null
        : Number.isFinite(typed)
          ? snap(typed, this.#bounds)
          : this.value;
    const changed = next !== this.value;
    this.value = next;
    input.value = this.#text;
    this.#touched = true;
    this.#sync();
    if (changed) this.#emit("purr-change");
  }

  /** Moves to a new value from the current text; false when nothing changed. */
  #moveTo(next: number | undefined) {
    if (next === undefined || this.readonly || this.matches(":disabled"))
      return false;
    const input = this.#input!;
    const changed = next !== this.value;
    this.value = next;
    input.value = this.#text;
    this.#sync();
    if (changed) {
      this.#emit("purr-input");
      this.#emit("purr-change");
    }
    return changed;
  }

  get #current() {
    const typed = parse(this.#input!.value);
    return typed !== null && Number.isFinite(typed) ? typed : this.value;
  }

  #step(direction: 1 | -1) {
    return this.#moveTo(stepBy(this.#current, direction, this.#bounds));
  }

  #press(direction: 1 | -1) {
    this.#release();
    if (!this.#step(direction)) return;
    const repeat = () => {
      if (this.#step(direction))
        this.#timer = window.setTimeout(repeat, REPEAT_INTERVAL);
    };
    this.#timer = window.setTimeout(repeat, REPEAT_DELAY);
  }

  #release = () => clearTimeout(this.#timer);

  #onInput = () => {
    const typed = parse(this.#input!.value);
    if (typed !== null && !Number.isFinite(typed)) return;
    // The form already sees what a commit would make of the typed text.
    this.#sync(typed === null ? null : snap(typed, this.#bounds));
    this.#emit("purr-input", typed);
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (event.isComposing || event.defaultPrevented) return;
    if (event.key === "Enter") {
      this.#commit();
      submitImplicitly(this.#internals.form);
      return;
    }
    // Text-editing shortcuts and a read-only field keep their native keys.
    if (
      event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      this.readonly
    )
      return;
    const next = valueAfterKey(event.key, this.#current, this.#bounds);
    if (next === undefined) return;
    event.preventDefault();
    this.#moveTo(next);
  };

  #syncLabelled() {
    this._labelled = !!this.textContent?.trim();
  }

  #button(part: "increment" | "decrement") {
    const direction = part === "increment" ? 1 : -1;
    const limit = direction === 1 ? this.max : this.min;
    const atLimit =
      this.value !== null &&
      limit !== null &&
      (direction === 1 ? this.value >= limit : this.value <= limit);
    return html`<button
      part=${part}
      type="button"
      tabindex="-1"
      aria-label=${direction === 1 ? "Increase" : "Decrease"}
      ?disabled=${atLimit || this.readonly || this.matches(":disabled")}
      @mousedown=${(event: Event) => event.preventDefault()}
      @pointerdown=${(event: PointerEvent) => {
        if (event.isPrimary && event.button === 0) this.#press(direction);
      }}
      @pointerup=${this.#release}
      @pointercancel=${this.#release}
      @pointerleave=${this.#release}
      @click=${(event: MouseEvent) => {
        // Pointer clicks stepped on pointerdown; assistive technology sends detail 0.
        if (event.detail === 0) this.#step(direction);
      }}
    >
      ${chevron(direction === 1 ? "M6 15l6 -6l6 6" : "M6 9l6 6l6 -6")}
    </button>`;
  }

  override render() {
    return html`<label part="label" for="control"><slot></slot></label>
      <div part="group">
        <div part="field">
          <input
            id="control"
            part="control"
            type="text"
            role="spinbutton"
            inputmode="decimal"
            autocomplete="off"
            .value=${this.#text}
            name=${ifDefined(this.name || undefined)}
            aria-label=${this._labelled ? nothing : ifDefined(this.label)}
            aria-valuenow=${ifDefined(this.value ?? undefined)}
            aria-valuemin=${ifDefined(this.min ?? undefined)}
            aria-valuemax=${ifDefined(this.max ?? undefined)}
            ?required=${this.required}
            ?readonly=${this.readonly}
            ?disabled=${this.matches(":disabled")}
            @input=${this.#onInput}
            @blur=${() => this.#commit()}
            @keydown=${this.#onKeydown}
          />
        </div>
        <div part="stepper">
          ${this.#button("increment")}${this.#button("decrement")}
        </div>
      </div>`;
  }
}

customElements.define("purr-number-field", PurrNumberField);

declare global {
  interface HTMLElementTagNameMap {
    "purr-number-field": PurrNumberField;
  }
}
