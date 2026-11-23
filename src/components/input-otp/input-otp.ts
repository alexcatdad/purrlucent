import { LitElement, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import {
  fieldMessage,
  syncFieldMessage,
} from "../../behaviors/field-message.ts";
import { submitImplicitly } from "../../behaviors/implicit-submit.ts";
import { labelText } from "../../behaviors/labels.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import { inputOtpStyles } from "./input-otp.css.ts";

/**
 * A one-time code field. One native input does the editing, so typing, paste,
 * the arrow keys, Backspace, IME and the system's one-time-code autofill (an
 * SMS code offered above the keyboard) work as in any text field; the code is
 * drawn as one box per character. It takes part in forms like `pl-input`: it
 * submits `name` with its value, a reset returns it to its `value` attribute,
 * a disabled fieldset disables it, and `required` and `pattern` set its
 * validity. A code that is started but shorter than `length` is invalid, with
 * a message once the field is left. Spaces and dashes are dropped, so a pasted
 * "123 456" fills all boxes.
 *
 * @attr {string} length - How many characters the code has. Defaults to 6.
 * @attr {string} value - The starting value. The `value` property holds the current one.
 * @attr {string} label - The accessible name when there is no slotted label.
 * @attr {string} inputmode - `numeric` (default) accepts digits only; `text` accepts letters and digits.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {string} name - The name submitted with a form.
 * @attr {boolean} required - The form is invalid while the field is empty.
 * @attr {boolean} readonly - The value can be selected but not edited.
 * @attr {boolean} disabled - No focus, nothing submitted.
 * @attr {string} pattern - A regular expression the whole value must match.
 * @attr {string} incomplete-message - The message shown for a code shorter than `length`. Defaults to "Enter all N characters."
 * @slot - The visible label.
 * @csspart label - The visible label.
 * @csspart field - The row of boxes.
 * @csspart box - One character box.
 * @csspart control - The native input, stretched over the boxes.
 * @csspart message - The icon and validation message below the field while it is invalid.
 * @fires {CustomEvent<{ value: string }>} pl-input - The value changed through editing. `detail.value` holds it.
 * @fires {CustomEvent<{ value: string }>} pl-change - The value was committed (blur or Enter after an edit). `detail.value` holds it.
 * @fires {CustomEvent<{ value: string }>} pl-complete - An edit left the code at `length` characters. `detail.value` holds it.
 * @fires input - The native input event of the inner input, which crosses the shadow root.
 * @fires change - After each pl-change, as a native input fires it.
 */
export class PlInputOtp extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = inputOtpStyles;
  static override properties = {
    length: { type: Number },
    value: {},
    label: {},
    inputmode: {},
    size: { reflect: true },
    name: { reflect: true },
    required: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    pattern: {},
    incompleteMessage: { attribute: "incomplete-message" },
    _labelled: { state: true },
    _focused: { state: true },
    _start: { state: true },
    _end: { state: true },
  };

  declare length: number;
  declare value: string;
  declare label: string | undefined;
  declare inputmode: string;
  declare size: "md" | "lg" | "xl";
  declare name: string;
  declare required: boolean;
  declare readonly: boolean;
  declare disabled: boolean;
  declare pattern: string | undefined;
  declare incompleteMessage: string | undefined;
  declare _labelled: boolean;
  declare _focused: boolean;
  declare _start: number;
  declare _end: number;

  readonly #internals = this.attachInternals();
  #touched = false;
  #custom = "";
  readonly #labelWatch = new MutationObserver(() => this.#syncLabelled());

  constructor() {
    super();
    this.addEventListener("invalid", () => {
      this.#touched = true;
      this.#sync();
    });
    this.addEventListener("focusin", () => this.requestUpdate());
    this.length = 6;
    this.value = "";
    this.inputmode = "numeric";
    this.size = "md";
    this.name = "";
    this.required = false;
    this.readonly = false;
    this.disabled = false;
    this._labelled = false;
    this._focused = false;
    this._start = 0;
    this._end = 0;
  }

  get #input() {
    return this.renderRoot?.querySelector<HTMLInputElement>("input");
  }

  get #n() {
    const n = Math.floor(Number(this.length));
    return n >= 1 ? n : 6;
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
    this.value = this.getAttribute("value") ?? "";
    this.requestUpdate();
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  /** Drops what the code cannot hold and cuts it to `length`. */
  #clean(raw: string) {
    const stripped = (raw ?? "").replace(/[\s-]+/g, "");
    const kept =
      this.inputmode === "text" ? stripped : stripped.replace(/\D+/g, "");
    return kept.slice(0, this.#n);
  }

  protected override willUpdate() {
    this.value = this.#clean(this.value);
  }

  protected override updated() {
    this.#setState("labelled", this._labelled);
    this.#sync();
  }

  #setState(name: string, on: boolean) {
    if (on) this.#internals.states.add(name);
    else this.#internals.states.delete(name);
  }

  #sync() {
    const input = this.#input;
    if (!input) return;
    input.setCustomValidity(this.#custom);
    let flags: ValidityStateFlags | ValidityState = input.validity;
    let message = input.validationMessage;
    if (
      input.validity.valid &&
      input.value.length > 0 &&
      input.value.length < this.#n
    ) {
      flags = { tooShort: true };
      message = this.incompleteMessage || `Enter all ${this.#n} characters.`;
    }
    this.#internals.setFormValue(input.value);
    this.#internals.setValidity(flags, message, input);
    const invalid = this.#touched && !this.#internals.validity.valid;
    this.#setState("user-invalid", invalid);
    if (invalid) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    syncFieldMessage(this.renderRoot as ShadowRoot, input, invalid, message);
  }

  #emit(name: "pl-input" | "pl-change" | "pl-complete") {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #readSelection = () => {
    const input = this.#input;
    if (!input) return;
    this._start = input.selectionStart ?? 0;
    this._end = input.selectionEnd ?? 0;
  };

  #onInput = (event: Event) => {
    // The composition is cleaned once, on compositionend.
    if ((event as InputEvent).isComposing) return;
    const input = event.target as HTMLInputElement;
    const caret = input.selectionStart ?? input.value.length;
    const clean = this.#clean(input.value);
    if (clean !== input.value) {
      const at = this.#clean(input.value.slice(0, caret)).length;
      input.value = clean;
      input.setSelectionRange(at, at);
    }
    this.#readSelection();
    if (clean === this.value) {
      // A rejected character is not an edit: keep it from the host.
      event.stopPropagation();
      return;
    }
    this.value = clean;
    this.#sync();
    this.#emit("pl-input");
    if (clean.length === this.#n) this.#emit("pl-complete");
  };

  #onChange = () => {
    this.#touched = true;
    this.#sync();
    this.#emit("pl-change");
    // The inner input's change event stays in the shadow root.
    fireNative(this, "change");
  };

  #onFocus = () => {
    this._focused = true;
    this.#readSelection();
  };

  #onBlur = () => {
    this._focused = false;
    this.#touched = true;
    this.#sync();
  };

  /** A plain click puts the caret at the box that was hit, never past the text. */
  #onClick = (event: MouseEvent) => {
    const input = event.target as HTMLInputElement;
    if (input.selectionStart !== input.selectionEnd) return;
    const boxes = [
      ...this.renderRoot.querySelectorAll<HTMLElement>('[part="box"]'),
    ];
    const hit = boxes.findIndex(
      (box) => event.clientX < box.getBoundingClientRect().right,
    );
    const at = Math.min(hit < 0 ? boxes.length : hit, input.value.length);
    input.setSelectionRange(at, at);
    this.#readSelection();
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (event.isComposing || event.defaultPrevented) return;
    if (event.key === "Enter") submitImplicitly(this.#internals.form, event);
  };

  #syncLabelled() {
    this._labelled = !!this.textContent?.trim();
  }

  override render() {
    const n = this.#n;
    const chars = [...this.value];
    const active = this._focused ? Math.min(this._start, n - 1) : -1;
    return html`<label part="label" for="control"><slot></slot></label>
      <div part="field" style="--_n:${n}">
        ${Array.from(
          { length: n },
          (_, i) =>
            html`<span
              part="box"
              aria-hidden="true"
              ?data-active=${i === active}
              ?data-selected=${this._focused && i >= this._start && i < this._end}
              >${chars[i] ?? ""}</span
            >`,
        )}
        <input
          id="control"
          part="control"
          type="text"
          .value=${this.value}
          autocomplete="one-time-code"
          inputmode=${this.inputmode === "text" ? "text" : "numeric"}
          spellcheck="false"
          autocapitalize="off"
          aria-label=${
            this._labelled
              ? nothing
              : ifDefined(this.label || labelText(this.labels))
          }
          pattern=${ifDefined(this.pattern)}
          ?required=${this.required}
          ?readonly=${this.readonly}
          ?disabled=${this.matches(":disabled")}
          @input=${this.#onInput}
          @compositionend=${this.#onInput}
          @change=${this.#onChange}
          @focus=${this.#onFocus}
          @blur=${this.#onBlur}
          @click=${this.#onClick}
          @keydown=${this.#onKeydown}
          @keyup=${this.#readSelection}
          @select=${this.#readSelection}
        />
      </div>
      ${fieldMessage}`;
  }
}

customElements.define("pl-input-otp", PlInputOtp);

declare global {
  interface HTMLElementTagNameMap {
    "pl-input-otp": PlInputOtp;
  }
}
