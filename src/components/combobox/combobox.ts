import { LitElement, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { DismissController } from "../../behaviors/dismiss.ts";
import { inputStyles } from "../input/input.css.ts";
import { filterIndexes } from "../select/match.ts";
import { PopupController } from "../select/popup.ts";
import { listboxStyles } from "../select/select.css.ts";
import type { PurrOption } from "../select/select.ts";
import "../select/select.ts";
import { comboboxStyles } from "./combobox.css.ts";

const chevron = html`<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M6 9l6 6l6 -6" />
</svg>`;

/** `ariaActiveDescendantElement` is missing from the DOM typings. */
type ActiveDescendantHost = HTMLInputElement & {
  ariaActiveDescendantElement: Element | null;
};

/**
 * A text field with a list of suggestions. It follows the editable combobox
 * pattern with list autocomplete: a native input inside does the editing and
 * keeps focus, the `purr-option` children are the choices, and the list shows
 * the ones whose label matches the typed text (starting with it first, then
 * containing it). It takes part in forms like `purr-input`: it submits `name`
 * with `value`, a form reset returns it to the option marked `selected`, and a
 * disabled fieldset disables it.
 *
 * Leaving the field with text that matches no option restores the last chosen
 * option's label, or keeps the text as the value when `allow-custom` is set.
 * Empty text means no value.
 *
 * @attr {string} value - The chosen option's value, or the custom text.
 * @attr {string} text - The visible text of the field.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} label - The accessible name. Required.
 * @attr {string} placeholder - Hint shown while the field is empty.
 * @attr {boolean} required - The form is invalid while there is no value.
 * @attr {boolean} disabled - No focus, no list, nothing submitted.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {boolean} allow-custom - Text that matches no option becomes the value.
 * @attr {boolean} open - The list is showing.
 * @slot - The `purr-option` children.
 * @csspart field - The shell around the input and the button.
 * @csspart control - The native input.
 * @csspart button - The chevron button that toggles the list.
 * @csspart listbox - The popup.
 * @csspart empty - The "no results" row.
 * @fires purr-input - The text changed through typing or Escape. `detail.text` holds it.
 * @fires purr-change - The value changed. `detail.value` holds it.
 */
export class PurrCombobox extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
    // Only the matching options are assigned, in their ranked order.
    slotAssignment: "manual" as const,
  };
  static override styles = [inputStyles, listboxStyles, comboboxStyles];
  static override properties = {
    value: { reflect: true },
    text: { reflect: true },
    name: { reflect: true },
    label: { reflect: true },
    placeholder: { reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    size: { reflect: true },
    allowCustom: { type: Boolean, reflect: true, attribute: "allow-custom" },
    open: { type: Boolean, reflect: true },
    _active: { state: true },
  };

  declare value: string;
  declare text: string;
  declare name: string;
  declare label: string;
  declare placeholder: string;
  declare required: boolean;
  declare disabled: boolean;
  declare size: "md" | "lg" | "xl";
  declare allowCustom: boolean;
  declare open: boolean;
  declare _active: PurrOption | null;

  readonly #internals = this.attachInternals();
  readonly #popup = new PopupController(
    this,
    () => this.#field,
    () => this.#listbox,
  );
  readonly #watch = new MutationObserver(() => this.#onOptions());
  // The typed text narrows the list only after an edit, not when it merely
  // opens on the chosen label.
  #filtering = false;
  #start: string | undefined;

  constructor() {
    super();
    this.value = "";
    this.text = "";
    this.name = "";
    this.label = "";
    this.placeholder = "";
    this.required = false;
    this.disabled = false;
    this.size = "md";
    this.allowCustom = false;
    this.open = false;
    this._active = null;
    new DismissController(this, {
      enabled: () => this.open,
      onDismiss: (reason) => {
        if (reason === "outside") this.#close();
      },
    });
    this.addEventListener("click", this.#onClick);
  }

  get #options(): PurrOption[] {
    return [...this.querySelectorAll("purr-option")];
  }

  get #listed(): PurrOption[] {
    const options = this.#options;
    return filterIndexes(
      options.map((o) => o.label),
      this.#filtering ? this.text : "",
    ).map((i) => options[i]!);
  }

  get #chosen(): PurrOption | undefined {
    return this.value
      ? this.#options.find((o) => o.optionValue === this.value)
      : undefined;
  }

  get #input(): ActiveDescendantHost {
    return this.shadowRoot!.querySelector("[part=control]")!;
  }

  get #field(): HTMLElement {
    return this.shadowRoot!.querySelector("[part=field]")!;
  }

  get #listbox(): HTMLElement {
    return this.shadowRoot!.querySelector("[part=listbox]")!;
  }

  formResetCallback() {
    this.value = this.#start ?? "";
    this.#filtering = false;
    this.#syncText();
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  #syncText() {
    this.text = this.#chosen?.label ?? (this.allowCustom ? this.value : "");
  }

  #emit(name: "purr-input" | "purr-change", detail: object) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true }),
    );
  }

  #setValue(value: string, text: string) {
    const changed = value !== this.value;
    this.value = value;
    this.text = text;
    if (changed) this.#emit("purr-change", { value });
  }

  #close() {
    this.#commit();
    this.#hide();
  }

  #hide() {
    this.open = false;
    this.#filtering = false;
    this._active = null;
  }

  // Resolves the typed text into a value when the user is done with it.
  #commit() {
    const text = this.text;
    const hit = this.#options.find(
      (o) => !o.disabled && o.label.toLowerCase() === text.toLowerCase(),
    );
    if (hit) this.#setValue(hit.optionValue, hit.label);
    // Empty text beside a value that shows nothing was never typed: keep it.
    else if (this.allowCustom || (!text && (this.#chosen || !this.value))) {
      this.#setValue(text, text);
    } else this.text = this.#chosen?.label ?? "";
  }

  #choose(option: PurrOption) {
    if (option.disabled) return;
    this.#setValue(option.optionValue, option.label);
    this.#hide();
  }

  #toggle() {
    if (this.matches(":disabled")) return;
    if (this.open) this.#hide();
    else this.#show(this.#chosen);
    this.#input.focus();
  }

  #show(active?: PurrOption) {
    this.open = true;
    this._active = active && this.#listed.includes(active) ? active : null;
  }

  #onClick = (event: Event) => {
    const option = (event.target as Element).closest("purr-option");
    if (option) this.#choose(option);
  };

  #onPointerover = (event: Event) => {
    const option = (event.target as Element).closest("purr-option");
    if (option && !option.disabled) this._active = option;
  };

  #onInput = (event: Event) => {
    this.text = (event.target as HTMLInputElement).value;
    this.#filtering = true;
    this.#show();
    this.#emit("purr-input", { text: this.text });
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (event.isComposing || event.ctrlKey || event.metaKey) return;
    const { key, altKey } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      if (altKey) {
        if (key === "ArrowDown") this.#show(this.#chosen);
        else this.#hide();
        return;
      }
      const down = key === "ArrowDown";
      const enabled = this.#listed.filter((o) => !o.disabled);
      if (!this.open) {
        this.#show(this.#chosen ?? (down ? enabled[0] : enabled.at(-1)));
      } else {
        const at = this._active ? enabled.indexOf(this._active) : -1;
        const next =
          at < 0 ? (down ? 0 : enabled.length - 1) : at + (down ? 1 : -1);
        this._active = enabled[next] ?? this._active;
      }
    } else if (key === "Enter" && this.open) {
      event.preventDefault();
      if (this._active) this.#choose(this._active);
      else this.#close();
    } else if (key === "Escape") {
      if (this.open) {
        event.preventDefault();
        this.#hide();
      } else if (this.text) {
        event.preventDefault();
        this.#filtering = false;
        this.#setValue("", "");
        this.#emit("purr-input", { text: "" });
      }
    }
  };

  #onOptions = () => {
    if (this.#start === undefined && this.#options.length) {
      this.#start =
        this.value || this.#options.find((o) => o.selected)?.optionValue || "";
      if (!this.value) this.value = this.#start;
      else if (!this.text) this.#syncText();
    }
    this.requestUpdate();
  };

  override connectedCallback() {
    super.connectedCallback();
    this.#watch.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watch.disconnect();
  }

  protected override firstUpdated() {
    this.#onOptions();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (this.open && this.matches(":disabled")) this.#hide();
    // Not on the first update: a starting `text` attribute is kept.
    if (changed.get("value") !== undefined && !this.#filtering) {
      this.#syncText();
    }
  }

  protected override updated() {
    const chosen = this.#chosen;
    const listed = this.#listed;
    const input = this.#input;
    for (const option of this.#options) {
      option.chosen = option === chosen;
      option.toggleAttribute("data-active", option === this._active);
    }
    this.shadowRoot!.querySelector("slot")!.assign(...listed);
    input.ariaActiveDescendantElement = this.open ? this._active : null;
    this.#internals.setFormValue(this.value);
    this.#internals.setValidity(
      { valueMissing: this.required && !this.value },
      "Choose an option to continue.",
      input,
    );
    this.#popup.sync(this.open);
    if (this.open) this.#popup.reposition();
    // After the popover shows: a hidden list cannot scroll.
    this._active?.scrollIntoView({ block: "nearest" });
  }

  override render() {
    const disabled = this.matches(":disabled");
    const empty = this.open && this.#filtering && !this.#listed.length;
    return html`<div part="field">
        <input
          id="control"
          part="control"
          type="text"
          role="combobox"
          autocomplete="off"
          spellcheck="false"
          aria-expanded=${this.open}
          aria-controls="list"
          aria-autocomplete="list"
          aria-label=${this.label || nothing}
          placeholder=${this.placeholder || nothing}
          .value=${this.text}
          ?required=${this.required}
          ?disabled=${disabled}
          @input=${this.#onInput}
          @keydown=${this.#onKeydown}
          @blur=${() => this.#close()}
        />
        <button
          part="button"
          type="button"
          tabindex="-1"
          aria-label=${this.label ? `${this.label}, show options` : "Show options"}
          aria-expanded=${this.open}
          aria-controls="list"
          ?disabled=${disabled}
          @mousedown=${(event: Event) => event.preventDefault()}
          @click=${() => this.#toggle()}
        >
          ${chevron}
        </button>
      </div>
      <div
        part="listbox"
        id="list"
        role="listbox"
        popover="manual"
        aria-label=${this.label || nothing}
        @mousedown=${(event: Event) => event.preventDefault()}
        @pointerover=${this.#onPointerover}
      >
        <slot></slot>
        ${
          empty
            ? html`<div
                part="empty"
                role="option"
                aria-disabled="true"
                aria-selected="false"
              >
                No results
              </div>`
            : nothing
        }
      </div>`;
  }
}

customElements.define("purr-combobox", PurrCombobox);

declare global {
  interface HTMLElementTagNameMap {
    "purr-combobox": PurrCombobox;
  }
}
