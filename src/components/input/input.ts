import { LitElement, html, nothing, svg } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { AriaWatch, forwardAria } from "../../behaviors/aria-forward.ts";
import {
  fieldMessage,
  syncFieldMessage,
} from "../../behaviors/field-message.ts";
import { submitImplicitly } from "../../behaviors/implicit-submit.ts";
import { labelText } from "../../behaviors/labels.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import { inputStyles } from "./input.css.ts";
import { messages } from "../../behaviors/locale.ts";

// Kept as a public export of this module.
export { submitImplicitly };

const glass = svg`<svg part="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>`;

const clearGlyph = svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-6.489 5.8a1 1 0 0 0 -1.218 1.567l1.292 1.293l-1.292 1.293l-.083 .094a1 1 0 0 0 1.497 1.32l1.293 -1.292l1.293 1.292l.094 .083a1 1 0 0 0 1.32 -1.497l-1.292 -1.293l1.292 -1.293l.083 -.094a1 1 0 0 0 -1.497 -1.32l-1.293 1.292l-1.293 -1.292l-.094 -.083z" /></svg>`;

/**
 * A single-line text field. A native input inside does the editing, so typing,
 * selection, IME, autofill and mobile keyboards behave as usual. The slotted
 * text is a visible label; without it, `label` becomes the input's accessible
 * name, and without both a native `<label for>` names it. It takes part in forms like a native input: it submits `name` with its
 * value, a reset returns it to its `value` attribute, a disabled fieldset
 * disables it, and the native validity (`required`, `pattern`, `type=email`...)
 * is the element's validity. Enter submits the form.
 *
 * The default width is 40 spacing units (160px), not the container's. Set `inline-size` on the element, for example `inline-size: 100%`, to change it.
 *
 * @attr {string} type - `text` (default), `search`, `password`, `email`, `url`, `tel` or `number`. A search field gets a magnifier and a clear button, and Escape clears it.
 * @attr {string} value - The starting value. The `value` property holds the current one.
 * @attr {string} label - The accessible name when there is no slotted label.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} placeholder - Hint shown while empty.
 * @attr {boolean} required - The form is invalid while the field is empty.
 * @attr {boolean} readonly - The value can be selected but not edited, and a search field cannot be cleared.
 * @attr {boolean} disabled - No focus, nothing submitted.
 * @attr {string} minlength - Shortest valid value.
 * @attr {string} maxlength - Longest allowed value.
 * @attr {string} min - Smallest valid value of a `number` field.
 * @attr {string} max - Largest valid value of a `number` field.
 * @attr {string} step - Step of a `number` field; `any` allows decimals.
 * @attr {string} pattern - A regular expression the value must match.
 * @attr {string} autocomplete - The autofill hint.
 * @attr {string} inputmode - The virtual keyboard hint.
 * @attr {string} clear-label - The clear button's accessible name. Defaults to the page language's text (see `setMessages`), in English "Clear".
 * @slot - The visible label.
 * @csspart label - The visible label.
 * @csspart field - The shell around the input.
 * @csspart control - The native input.
 * @csspart glyph - The magnifier of a search field.
 * @csspart clear - The clear button of a search field.
 * @csspart message - The icon and validation message below the field while it is invalid.
 * @fires {CustomEvent<{ value: string }>} pl-input - The value changed through editing or the clear button. `detail.value` holds it.
 * @fires {CustomEvent<{ value: string }>} pl-change - The value was committed (blur or Enter after an edit) or cleared. `detail.value` holds it.
 * @fires input - After each pl-input, as a native input fires it.
 * @fires change - After each pl-change, as a native input fires it.
 */
export class PlInput extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = inputStyles;
  static override properties = {
    type: { reflect: true },
    value: {},
    label: {},
    size: { reflect: true },
    name: { reflect: true },
    placeholder: {},
    required: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    minlength: {},
    maxlength: {},
    min: {},
    max: {},
    step: {},
    pattern: {},
    autocomplete: {},
    inputmode: {},
    clearLabel: { attribute: "clear-label" },
    _labelled: { state: true },
  };

  declare type: string;
  declare value: string;
  declare label: string | undefined;
  declare size: "md" | "lg" | "xl";
  declare name: string;
  declare placeholder: string | undefined;
  declare required: boolean;
  declare readonly: boolean;
  declare disabled: boolean;
  declare minlength: string | undefined;
  declare maxlength: string | undefined;
  declare min: string | undefined;
  declare max: string | undefined;
  declare step: string | undefined;
  declare pattern: string | undefined;
  declare autocomplete: string | undefined;
  declare inputmode: string | undefined;
  declare clearLabel: string;
  declare _labelled: boolean;

  readonly #internals = this.attachInternals();
  #touched = false;
  readonly #labelWatch = new MutationObserver(() => this.#syncLabelled());
  readonly #ariaWatch = new AriaWatch(this, () => this.#sync());

  constructor() {
    super();
    // A blocked submit or reportValidity() is an interaction too.
    this.addEventListener("invalid", () => {
      this.#touched = true;
      this.#sync();
    });
    // A label added after the field still names it before it is read out.
    this.addEventListener("focusin", () => this.requestUpdate());
    this.type = "text";
    this.value = "";
    this.size = "md";
    this.name = "";
    this.required = false;
    this.readonly = false;
    this.disabled = false;
    this.clearLabel = "";
    this._labelled = false;
  }

  /** Kept here so a message set before the first render is not lost. */
  #custom = "";

  get #input() {
    return this.renderRoot?.querySelector<HTMLInputElement>("input");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#labelWatch.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.#ariaWatch.observe();
    this.#syncLabelled();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#labelWatch.disconnect();
    this.#ariaWatch.disconnect();
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
    // An unchanged value schedules no update, but the touched state must clear.
    this.requestUpdate();
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  // After the update, so the inner input already holds the new value and attributes.
  protected override updated() {
    this.#setState("search", this.type === "search");
    this.#setState("labelled", this._labelled);
    this.#setState("clearable", this.#clearable);
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
    const invalid = this.#touched && !input.validity.valid;
    this.#internals.setFormValue(input.value);
    this.#internals.setValidity(input.validity, input.validationMessage, input);
    this.#setState("user-invalid", invalid);
    if (invalid) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    forwardAria(this, input);
    syncFieldMessage(this.renderRoot as ShadowRoot, input, invalid);
  }

  get #clearable() {
    return (
      this.type === "search" &&
      !!this.value &&
      !this.readonly &&
      !this.matches(":disabled")
    );
  }

  #emit(name: "pl-input" | "pl-change") {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onInput = (event: Event) => {
    this.value = (event.target as HTMLInputElement).value;
    this.#sync();
    this.#emit("pl-input");
  };

  #onChange = () => {
    this.#touched = true;
    this.#sync();
    this.#emit("pl-change");
    // The inner input's change event stays in the shadow root.
    fireNative(this, "change");
  };

  #onBlur = () => {
    this.#touched = true;
    this.#sync();
  };

  #clear() {
    const input = this.#input!;
    input.value = "";
    this.value = "";
    input.focus();
    this.#sync();
    this.#emit("pl-input");
    fireNative(this, "input");
    this.#emit("pl-change");
    fireNative(this, "change");
  }

  #onKeydown = (event: KeyboardEvent) => {
    if (event.isComposing || event.defaultPrevented) return;
    if (event.key === "Enter") submitImplicitly(this.#internals.form, event);
    else if (event.key === "Escape" && this.#clearable) {
      event.preventDefault();
      this.#clear();
    }
  };

  // Watches the light DOM: editing a slotted label's text fires no slotchange.
  #syncLabelled() {
    this._labelled = !!this.textContent?.trim();
  }

  override render() {
    const search = this.type === "search";
    return html`<label part="label" for="control"><slot></slot></label>
      <div part="field">
        ${search ? glass : nothing}
        <input
          id="control"
          part="control"
          type=${this.type}
          .value=${this.value}
          name=${ifDefined(this.name || undefined)}
          aria-label=${
            this._labelled
              ? nothing
              : ifDefined(this.label || labelText(this.labels))
          }
          placeholder=${ifDefined(this.placeholder)}
          ?required=${this.required}
          ?readonly=${this.readonly}
          ?disabled=${this.matches(":disabled")}
          minlength=${ifDefined(this.minlength)}
          maxlength=${ifDefined(this.maxlength)}
          min=${ifDefined(this.min)}
          max=${ifDefined(this.max)}
          step=${ifDefined(this.step)}
          pattern=${ifDefined(this.pattern)}
          autocomplete=${ifDefined(this.autocomplete)}
          inputmode=${ifDefined(this.inputmode)}
          @input=${this.#onInput}
          @change=${this.#onChange}
          @blur=${this.#onBlur}
          @keydown=${this.#onKeydown}
        />
        ${
          this.#clearable
            ? html`<button
                part="clear"
                type="button"
                aria-label=${this.clearLabel || messages(this).clear}
                @mousedown=${(event: Event) => event.preventDefault()}
                @click=${() => this.#clear()}
              >
                ${clearGlyph}
              </button>`
            : nothing
        }
      </div>
      ${fieldMessage}`;
  }
}

customElements.define("pl-input", PlInput);

declare global {
  interface HTMLElementTagNameMap {
    "pl-input": PlInput;
  }
}
