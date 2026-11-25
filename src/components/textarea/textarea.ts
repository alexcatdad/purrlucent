import { LensController } from "../../behaviors/lens.ts";
import { LitElement, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { AriaWatch, forwardAria } from "../../behaviors/aria-forward.ts";
import {
  fieldMessage,
  syncFieldMessage,
} from "../../behaviors/field-message.ts";
import { labelText } from "../../behaviors/labels.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import { textareaStyles } from "./textarea.css.ts";

/**
 * A multi-line text field. A native textarea inside does the editing, so
 * typing, selection, IME and mobile keyboards behave as usual. The slotted
 * text is a visible label; without it, `label` becomes the textarea's
 * accessible name, and without both a native `<label for>` names it. It takes part in forms like a native textarea: it submits
 * `name` with its value, a reset returns it to its `value` attribute, a
 * disabled fieldset disables it, and the native validity (`required`,
 * `minlength`, `maxlength`) is the element's validity.
 *
 * The default width is 60 spacing units (240px), not the container's. Set `inline-size` on the element, for example `inline-size: 100%`, to change it.
 *
 * @attr {string} value - The starting value. The `value` property holds the current one.
 * @attr {string} label - The accessible name when there is no slotted label.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} placeholder - Hint shown while empty.
 * @attr {string} rows - The number of visible lines; without it the field is a fixed comfortable height.
 * @attr {string} resize - `vertical` (default) or `none`.
 * @attr {string} size - `md` (default), `lg` or `xl`; sets the minimum height and the inline padding.
 * @attr {boolean} required - The form is invalid while the field is empty.
 * @attr {boolean} readonly - The value can be selected but not edited.
 * @attr {boolean} disabled - No focus, nothing submitted.
 * @attr {string} minlength - Shortest valid value.
 * @attr {string} maxlength - Longest allowed value.
 * @slot - The visible label.
 * @csspart label - The visible label.
 * @csspart field - The shell around the textarea.
 * @csspart control - The native textarea.
 * @csspart message - The icon and validation message below the field while it is invalid.
 * @fires {CustomEvent<{ value: string }>} pl-input - The value changed through editing. `detail.value` holds it.
 * @fires {CustomEvent<{ value: string }>} pl-change - The value was committed (blur after an edit). `detail.value` holds it.
 * @fires input - After each pl-input, as a native textarea fires it.
 * @fires change - After each pl-change, as a native textarea fires it.
 */
export class PlTextarea extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = textareaStyles;
  static override properties = {
    value: {},
    label: {},
    name: { reflect: true },
    placeholder: {},
    rows: { reflect: true },
    resize: { reflect: true },
    size: { reflect: true },
    required: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    minlength: {},
    maxlength: {},
    _labelled: { state: true },
  };

  declare value: string;
  declare label: string | undefined;
  declare name: string;
  declare placeholder: string | undefined;
  declare rows: string | undefined;
  declare resize: "vertical" | "none";
  declare size: "md" | "lg" | "xl";
  declare required: boolean;
  declare readonly: boolean;
  declare disabled: boolean;
  declare minlength: string | undefined;
  declare maxlength: string | undefined;
  declare _labelled: boolean;

  readonly #internals = this.attachInternals();
  #touched = false;
  // Kept here: the inner control does not exist before the first render.
  #custom = "";
  readonly #labelWatch = new MutationObserver(() => this.#syncLabelled());
  readonly #ariaWatch = new AriaWatch(this, () => this.#sync());

  constructor() {
    super();
    new LensController(this, "[part=field]");
    // A blocked submit or reportValidity() is an interaction too.
    this.addEventListener("invalid", () => {
      this.#touched = true;
      this.#sync();
    });
    // A label added after the field still names it before it is read out.
    this.addEventListener("focusin", () => this.requestUpdate());
    this.value = "";
    this.name = "";
    this.resize = "vertical";
    this.size = "md";
    this.required = false;
    this.readonly = false;
    this.disabled = false;
    this._labelled = false;
  }

  get #control() {
    return this.renderRoot?.querySelector<HTMLTextAreaElement>("textarea");
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
    // Deferred: reflecting `disabled` calls this mid-update, where a request is dropped.
    queueMicrotask(() => this.requestUpdate());
  }

  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  // After the update, so the inner control already holds the new value and attributes.
  protected override updated() {
    if (this._labelled) this.#internals.states.add("labelled");
    else this.#internals.states.delete("labelled");
    this.#sync();
  }

  #sync() {
    const control = this.#control;
    if (!control) return;
    control.setCustomValidity(this.#custom);
    const invalid = this.#touched && !control.validity.valid;
    this.#internals.setFormValue(control.value);
    this.#internals.setValidity(
      control.validity,
      control.validationMessage,
      control,
    );
    if (invalid) this.#internals.states.add("user-invalid");
    else this.#internals.states.delete("user-invalid");
    if (invalid) control.setAttribute("aria-invalid", "true");
    else control.removeAttribute("aria-invalid");
    forwardAria(this, control);
    syncFieldMessage(this.renderRoot as ShadowRoot, control, invalid);
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
    this.value = (event.target as HTMLTextAreaElement).value;
    this.#sync();
    this.#emit("pl-input");
  };

  #onChange = () => {
    this.#touched = true;
    this.#sync();
    this.#emit("pl-change");
    // The inner textarea's change event stays in the shadow root.
    fireNative(this, "change");
  };

  #onBlur = () => {
    this.#touched = true;
    this.#sync();
  };

  // Watches the light DOM: editing a slotted label's text fires no slotchange.
  #syncLabelled() {
    this._labelled = !!this.textContent?.trim();
  }

  override render() {
    return html`<label part="label" for="control"><slot></slot></label>
      <div part="field">
        <textarea
          id="control"
          part="control"
          .value=${this.value}
          name=${ifDefined(this.name || undefined)}
          aria-label=${
            this._labelled
              ? nothing
              : ifDefined(this.label || labelText(this.labels))
          }
          placeholder=${ifDefined(this.placeholder)}
          rows=${ifDefined(this.rows)}
          ?required=${this.required}
          ?readonly=${this.readonly}
          ?disabled=${this.matches(":disabled")}
          minlength=${ifDefined(this.minlength)}
          maxlength=${ifDefined(this.maxlength)}
          @input=${this.#onInput}
          @change=${this.#onChange}
          @blur=${this.#onBlur}
        ></textarea>
      </div>
      ${fieldMessage}`;
  }
}

customElements.define("pl-textarea", PlTextarea);

declare global {
  interface HTMLElementTagNameMap {
    "pl-textarea": PlTextarea;
  }
}
