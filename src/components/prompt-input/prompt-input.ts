import { LitElement, html, svg, type PropertyValues } from "lit";
import { labelText } from "../../behaviors/labels.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import "../button/button.ts";
import "../input-group/input-group.ts";
import "../textarea/textarea.ts";
import type { PlTextarea } from "../textarea/textarea.ts";
import { promptInputStyles } from "./prompt-input.css.ts";

const sendGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>`;
const stopGlyph = svg`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>`;

/**
 * The chat composer: a text field that grows from one line to about eight,
 * then scrolls, with a send button at its end. Enter sends and Shift+Enter
 * inserts a newline; Enter during IME composition never sends. Send is off
 * while the text is empty or only whitespace. While `busy` (a reply is
 * streaming) the button becomes Stop, the field stays editable for the next
 * message, and Enter sends nothing. `label` names the field for assistive
 * technology and is not shown; without it a native `<label for>` names it, and
 * without both the name is "Message". It takes part in forms like a native
 * textarea (`name`, `value`, `required`, `disabled`, reset) but never submits
 * the form itself: listen for `pl-submit`.
 *
 * @attr {string} value - The starting text. The `value` property holds the current one.
 * @attr {string} label - The accessible name of the field.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} placeholder - Hint shown while empty.
 * @attr {boolean} required - The form is invalid while the field is empty.
 * @attr {boolean} disabled - No focus, no send, nothing submitted.
 * @attr {boolean} busy - A reply is streaming: the send button becomes Stop.
 * @slot start - Tools before the field, such as an attach button. Give an icon `pl-button` an `aria-label`.
 * @slot end - Tools before the send button, such as a model picker.
 * @fires {CustomEvent<{ value: string }>} pl-input - The text changed through editing. `detail.value` holds it.
 * @fires {CustomEvent<{ value: string }>} pl-change - The text was committed (blur after an edit). `detail.value` holds it.
 * @fires {CustomEvent<{ value: string }>} pl-submit - Enter or Send, with the text trimmed. Cancelable: the field clears unless it is prevented.
 * @fires {CustomEvent<void>} pl-stop - Stop was pressed while `busy`.
 * @fires input - After each pl-input, as a native textarea fires it.
 * @fires change - After each pl-change, as a native textarea fires it.
 */
export class PlPromptInput extends LitElement {
  static formAssociated = true;
  static override styles = promptInputStyles;
  static override properties = {
    value: {},
    label: {},
    name: { reflect: true },
    placeholder: {},
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    busy: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare label: string | undefined;
  declare name: string;
  declare placeholder: string | undefined;
  declare required: boolean;
  declare disabled: boolean;
  declare busy: boolean;

  readonly #internals = this.attachInternals();
  #width = 0;
  readonly #resize = new ResizeObserver(([entry]) => {
    const width = entry?.contentRect.width ?? 0;
    if (width === this.#width) return;
    this.#width = width;
    this.#grow();
  });

  constructor() {
    super();
    this.value = "";
    this.name = "";
    this.required = false;
    this.disabled = false;
    this.busy = false;
    // A label added after the field still names it before it is read out.
    this.addEventListener("focusin", () => this.requestUpdate());
  }

  get #field() {
    return this.renderRoot?.querySelector<PlTextarea>("pl-textarea") ?? null;
  }

  get #text() {
    return this.value ?? "";
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated && this.#field) this.#resize.observe(this.#field);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
  }

  override focus(options?: FocusOptions) {
    this.#field?.focus(options);
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

  formResetCallback() {
    this.value = this.getAttribute("value") ?? "";
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  protected override firstUpdated() {
    if (this.#field) this.#resize.observe(this.#field);
  }

  // After the update, so the inner field already holds the new text.
  protected override updated(changed: PropertyValues) {
    this.#internals.setFormValue(this.#text);
    this.#validate();
    if (changed.has("value"))
      void this.#field?.updateComplete.then(() => this.#grow());
  }

  #validate() {
    if (!this.required || this.#text) {
      this.#internals.setValidity({});
      return;
    }
    // The browser's own, localised message for an empty required field.
    const probe = Object.assign(document.createElement("textarea"), {
      required: true,
    });
    this.#internals.setValidity(
      { valueMissing: true },
      probe.validationMessage,
      this.#field ?? undefined,
    );
  }

  /** Fits the native textarea to its text; the stylesheet caps its height. */
  #grow() {
    const control = this.#field?.shadowRoot?.querySelector("textarea");
    if (!control) return;
    // Collapsed first, so scrollHeight is the text's own height, whatever an
    // auto-sized field would be stretched to by its surroundings.
    control.style.blockSize = "0px";
    control.style.blockSize = `${control.scrollHeight}px`;
  }

  #emit(name: "pl-input" | "pl-change") {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { value: this.#text },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // The textarea's own events stop here: this element fires them for itself.
  #onInput = (event: Event) => {
    event.stopPropagation();
    this.value = (event as CustomEvent<{ value: string }>).detail.value;
    this.#emit("pl-input");
    fireNative(this, "input");
  };

  #onChange = (event: Event) => {
    event.stopPropagation();
    this.#emit("pl-change");
    fireNative(this, "change");
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.isComposing ||
      // Safari reports the Enter that confirms a composition as keyCode 229.
      event.keyCode === 229
    )
      return;
    event.preventDefault();
    if (!this.busy) this.#submit();
  };

  #submit() {
    const value = this.#text.trim();
    if (!value) return;
    const sent = this.dispatchEvent(
      new CustomEvent("pl-submit", {
        detail: { value },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    if (sent) this.value = "";
    this.focus();
  }

  #onPress = (event: Event) => {
    event.stopPropagation();
    if (!this.busy) return this.#submit();
    this.dispatchEvent(
      new CustomEvent("pl-stop", { bubbles: true, composed: true }),
    );
    this.focus();
  };

  override render() {
    const off = this.matches(":disabled");
    return html`<pl-input-group>
      <span slot="start" hidden
        ><slot name="start" @slotchange=${hideWhenEmpty}></slot
      ></span>
      <pl-textarea
        rows="1"
        resize="none"
        size="lg"
        label=${this.label || labelText(this.labels) || "Message"}
        placeholder=${this.placeholder ?? ""}
        .value=${this.#text}
        ?disabled=${off}
        @keydown=${this.#onKeydown}
        @input=${(event: Event) => event.stopPropagation()}
        @pl-input=${this.#onInput}
        @pl-change=${this.#onChange}
      ></pl-textarea>
      <span slot="end"
        ><slot name="end"></slot
        ><pl-button
          icon
          variant="primary"
          aria-label=${this.busy ? "Stop" : "Send"}
          ?disabled=${off || (!this.busy && !this.#text.trim())}
          @pl-press=${this.#onPress}
          >${this.busy ? stopGlyph : sendGlyph}</pl-button
        ></span
      >
    </pl-input-group>`;
  }
}

customElements.define("pl-prompt-input", PlPromptInput);

declare global {
  interface HTMLElementTagNameMap {
    "pl-prompt-input": PlPromptInput;
  }
}
