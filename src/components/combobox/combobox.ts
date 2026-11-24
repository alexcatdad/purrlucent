import { LitElement, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { DismissController } from "../../behaviors/dismiss.ts";
import {
  fieldMessage,
  syncFieldMessage,
} from "../../behaviors/field-message.ts";
import { submitImplicitly } from "../../behaviors/implicit-submit.ts";
import { labelText } from "../../behaviors/labels.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import { fill, messages } from "../../behaviors/locale.ts";
import { nativeMessage } from "../../behaviors/native-message.ts";
import { inputStyles } from "../input/input.css.ts";
import { filterIndexes } from "../select/match.ts";
import { PopupController } from "../select/popup.ts";
import { listboxStyles } from "../select/select.css.ts";
import type { PlOption } from "../select/select.ts";
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
 * keeps focus, the `pl-option` children are the choices, and the list shows
 * the ones whose label matches the typed text (starting with it first, then
 * containing it). It takes part in forms like `pl-input`: it submits `name`
 * with `value`, a form reset returns it to the option marked `selected`, and a
 * disabled fieldset disables it. A `slot="label"` element is a visible label
 * that names the field; without it, `label` becomes the accessible name, and
 * without both a native `<label for>` names it.
 *
 * Leaving the field with text that matches no option restores the last chosen
 * option's label, or keeps the text as the value when `allow-custom` is set.
 * Empty text means no value. Return with the list closed presses the form's
 * default button, as in a text field. Once the field has been left, a required
 * field with no value shows the validation message below it. The list is as
 * wide as the field: a long option wraps, and a long value ends in an ellipsis.
 *
 * With `manual-filter` the list is never narrowed or reordered here: the app
 * listens to `pl-input` and replaces the options itself, as when it searches
 * on a server. A `pl-option` with the `action` attribute is a row that fires
 * `pl-action` instead of choosing a value; it is always listed, and the
 * `action-label` attribute adds such a row ("Add" and the typed text) while
 * text has been typed. While the app's lookup is running, `busy` keeps the "no
 * results" row from showing.
 *
 * The default width is 40 spacing units (160px), not the container's. Set `inline-size` on the element, for example `inline-size: 100%`, to change it.
 *
 * @attr {string} value - The chosen option's value, or the custom text.
 * @attr {string} text - The visible text of the field.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} label - The accessible name when there is no slotted label.
 * @attr {string} placeholder - Hint shown while the field is empty.
 * @attr {boolean} required - The form is invalid while there is no value.
 * @attr {boolean} disabled - No focus, no list, nothing submitted.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {boolean} allow-custom - Text that matches no option becomes the value.
 * @attr {boolean} open - The list is showing.
 * @attr {string} toggle-label - The chevron button's accessible name. Defaults to the page language's text (see `setMessages`), in English "Show options", which becomes "<label>, show options" when the field has a label.
 * @attr {string} empty-label - The text shown when no option matches. Defaults to the page language's text (see `setMessages`), in English "No results".
 * @attr {boolean} manual-filter - The app filters the options; the typed text does not narrow the list.
 * @attr {boolean} busy - The app's lookup is running: the "no results" row is not shown, only the action row.
 * @attr {string} action-label - Shows an action row while text is typed. Its text defaults to the page language's text (see `setMessages`), in English "Add {query}"; `{query}` stands for the typed text.
 * @slot - The `pl-option` children.
 * @slot label - The visible label.
 * @csspart label - The visible label.
 * @csspart action - The row that `action-label` adds.
 * @csspart field - The shell around the input and the button.
 * @csspart control - The native input.
 * @csspart button - The chevron button that toggles the list.
 * @csspart listbox - The popup.
 * @csspart empty - The "no results" row.
 * @csspart message - The validation message below the field.
 * @fires {CustomEvent<{ text: string }>} pl-input - The text changed through typing, Escape, or leaving the field (the text was cleared or restored). `detail.text` holds it.
 * @fires {CustomEvent<{ value: string }>} pl-change - The value changed. `detail.value` holds it.
 * @fires {CustomEvent<{ query: string }>} pl-action - An action row was chosen. `detail.query` holds the typed text, empty when nothing was typed.
 * @fires input - After each pl-input, as a native input fires it.
 * @fires change - After each pl-change.
 */
export class PlCombobox extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
    // Only the matching options are assigned, in their ranked order; the
    // label slot is assigned by hand too.
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
    toggleLabel: { attribute: "toggle-label" },
    emptyLabel: { attribute: "empty-label" },
    manualFilter: { type: Boolean, reflect: true, attribute: "manual-filter" },
    busy: { type: Boolean, reflect: true },
    actionLabel: { attribute: "action-label" },
    _active: { state: true },
    _labelled: { state: true },
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
  declare toggleLabel: string;
  declare emptyLabel: string;
  declare manualFilter: boolean;
  declare busy: boolean;
  declare actionLabel: string | null;
  declare _active: PlOption | null;
  declare _labelled: boolean;

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
  #touched = false;

  constructor() {
    super();
    // A blocked submit or reportValidity() is an interaction too.
    this.addEventListener("invalid", () => {
      this.#touched = true;
      this.#syncForm();
    });
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
    this.toggleLabel = "";
    this.emptyLabel = "";
    this.manualFilter = false;
    this.busy = false;
    this.actionLabel = null;
    this._active = null;
    this._labelled = false;
    new DismissController(this, {
      enabled: () => this.open,
      onDismiss: (reason) => {
        if (reason === "outside") this.#close();
      },
    });
    this.addEventListener("click", this.#onClick);
    // A label added after the field still names it before it is read out.
    this.addEventListener("focusin", () => this.requestUpdate());
  }

  get #labels(): Element[] {
    return [...this.querySelectorAll(":scope > [slot=label]")];
  }

  get #options(): PlOption[] {
    return [...this.querySelectorAll("pl-option")];
  }

  /** The text typed since the list last closed. */
  get #query(): string {
    return this.#filtering ? this.text : "";
  }

  // Action rows are never filtered and come last.
  get #listed(): PlOption[] {
    const options = this.#options.filter((o) => !o.action);
    const shown = this.manualFilter
      ? options
      : filterIndexes(
          options.map((o) => o.label),
          this.#query,
        ).map((i) => options[i]!);
    return [...shown, ...this.#options.filter((o) => o.action)];
  }

  /** The row that `action-label` adds, once there is text for it to use. */
  get #builtin(): PlOption | null {
    return this.shadowRoot!.querySelector("[part=action]");
  }

  /** Every row the arrow keys can reach. */
  get #rows(): PlOption[] {
    const builtin = this.#builtin;
    return [...this.#listed, ...(builtin ? [builtin] : [])];
  }

  get #chosen(): PlOption | undefined {
    return this.value
      ? this.#options.find((o) => !o.action && o.optionValue === this.value)
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
    this.#touched = false;
    this.value = this.#start ?? "";
    this.#filtering = false;
    this.#syncText();
    // An unchanged value schedules no update, but the touched state must clear.
    this.#syncForm();
  }

  /** The form value, validity and the shown message, kept in step with `value`. */
  #syncForm() {
    // Not rendered yet: the first update syncs.
    const input = this.shadowRoot?.querySelector<HTMLInputElement>("input");
    if (!input) return;
    this.#internals.setFormValue(this.value);
    this.#internals.setValidity(
      { valueMissing: this.required && !this.value },
      nativeMessage(this, "select", "selectRequired"),
      input,
    );
    const invalid = this.#touched && !this.#internals.validity.valid;
    if (invalid) this.#internals.states.add("user-invalid");
    else this.#internals.states.delete("user-invalid");
    if (invalid) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    syncFieldMessage(
      this.shadowRoot!,
      input,
      invalid,
      this.#internals.validationMessage,
    );
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  #syncText() {
    this.text = this.#chosen?.label ?? (this.allowCustom ? this.value : "");
  }

  #emit(name: "pl-input" | "pl-change" | "pl-action", detail: object) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true }),
    );
  }

  #setValue(value: string, text: string) {
    const changed = value !== this.value;
    this.value = value;
    this.text = text;
    if (!changed) return;
    this.#emit("pl-change", { value });
    fireNative(this, "change");
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
    const before = this.text;
    this.#resolve();
    // An app that mirrors the text must learn that leaving changed it.
    if (this.text === before) return;
    this.#emit("pl-input", { text: this.text });
    fireNative(this, "input");
  }

  #resolve() {
    const text = this.text;
    const hit = this.#options.find(
      (o) =>
        !o.action &&
        !o.disabled &&
        o.label.toLowerCase() === text.toLowerCase(),
    );
    if (hit) this.#setValue(hit.optionValue, hit.label);
    // Empty text beside a value that shows nothing was never typed: keep it.
    else if (this.allowCustom || (!text && (this.#chosen || !this.value))) {
      this.#setValue(text, text);
    } else if (!(this.manualFilter && this.value && !this.#chosen)) {
      // The app's list may not hold the chosen option: then keep text and value.
      this.text = this.#chosen?.label ?? "";
    }
  }

  #choose(option: PlOption) {
    if (option.disabled) return;
    if (option.action) {
      // Typed text stays the query after Escape; a chosen label is not typed.
      const query =
        this.#filtering || this.text !== this.#chosen?.label
          ? this.text.trim()
          : "";
      this.#hide();
      this.#emit("pl-action", { query });
      return;
    }
    this.#setValue(option.optionValue, option.label);
    this.#hide();
  }

  #toggle() {
    if (this.matches(":disabled")) return;
    if (this.open) this.#hide();
    else this.#show(this.#chosen);
    this.#input.focus();
  }

  #show(active?: PlOption) {
    this.open = true;
    this._active = active && this.#rows.includes(active) ? active : null;
  }

  #onClick = (event: Event) => {
    const option = (event.target as Element).closest("pl-option");
    if (option) this.#choose(option);
  };

  #onPointerover = (event: Event) => {
    const option = (event.target as Element).closest("pl-option");
    if (option && !option.disabled) this._active = option;
  };

  #onBlur = () => {
    this.#touched = true;
    this.#close();
    this.#syncForm();
  };

  #onInput = (event: Event) => {
    this.text = (event.target as HTMLInputElement).value;
    // The added row goes with the text.
    if (this._active === this.#builtin && !this.text.trim())
      this._active = null;
    this.#filtering = true;
    this.#show();
    this.#emit("pl-input", { text: this.text });
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
      const enabled = this.#rows.filter((o) => !o.disabled);
      if (!this.open) {
        this.#show(this.#chosen ?? (down ? enabled[0] : enabled.at(-1)));
      } else {
        const at = this._active ? enabled.indexOf(this._active) : -1;
        const next =
          at < 0 ? (down ? 0 : enabled.length - 1) : at + (down ? 1 : -1);
        this._active = enabled[next] ?? this._active;
      }
    } else if (key === "Enter") {
      if (this.open) {
        event.preventDefault();
        if (this._active) this.#choose(this._active);
        else this.#close();
      } else {
        // The typed text becomes the value before the form reads it.
        this.#commit();
        this.#syncForm();
        submitImplicitly(this.#internals.form, event);
      }
    } else if (key === "Escape") {
      if (this.open) {
        event.preventDefault();
        this.#hide();
      } else if (this.text) {
        event.preventDefault();
        this.#filtering = false;
        this.#setValue("", "");
        this.#emit("pl-input", { text: "" });
        // Typing fires the inner input's own input event; clearing does not.
        fireNative(this, "input");
      }
    }
  };

  // The observer also watches the slotted label: editing its text fires no slotchange.
  #syncLabelled() {
    this._labelled = this.#labels.some((el) => !!el.textContent?.trim());
  }

  #onOptions = () => {
    this.#syncLabelled();
    // An option the app removed can no longer be chosen.
    if (this._active && !this.#rows.includes(this._active)) this._active = null;
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
    this.#syncLabelled();
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
    const builtin = this.#builtin;
    for (const option of [...this.#options, ...(builtin ? [builtin] : [])]) {
      option.chosen = option === chosen;
      option.toggleAttribute("data-active", option === this._active);
    }
    const root = this.shadowRoot!;
    root.querySelector<HTMLSlotElement>("slot:not([name])")!.assign(...listed);
    root
      .querySelector<HTMLSlotElement>("slot[name=label]")!
      .assign(...this.#labels);
    if (this._labelled) this.#internals.states.add("labelled");
    else this.#internals.states.delete("labelled");
    input.ariaActiveDescendantElement = this.open ? this._active : null;
    this.#syncForm();
    this.#popup.sync(this.open);
    if (this.open) this.#popup.reposition();
    // After the popover shows: a hidden list cannot scroll.
    this._active?.scrollIntoView({ block: "nearest" });
  }

  override render() {
    const disabled = this.matches(":disabled");
    const empty =
      this.open &&
      this.#filtering &&
      !this.busy &&
      this.#listed.every((o) => o.action);
    const query = this.text.trim();
    const add = this.actionLabel !== null && this.#filtering && query;
    const name = this._labelled
      ? undefined
      : this.label || labelText(this.#internals.labels);
    const labelledby = this._labelled ? "label" : nothing;
    // The chevron's name repeats the field's, as "<label>, show options".
    const field = this._labelled
      ? this.#labels.map((el) => el.textContent?.trim()).join(" ")
      : name;
    return html`<label part="label" id="label" for="control"
        ><slot name="label"></slot
      ></label>
      <div part="field">
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
          aria-label=${ifDefined(name)}
          placeholder=${this.placeholder || nothing}
          .value=${this.text}
          ?required=${this.required}
          ?disabled=${disabled}
          @input=${this.#onInput}
          @keydown=${this.#onKeydown}
          @blur=${this.#onBlur}
        />
        <button
          part="button"
          type="button"
          tabindex="-1"
          aria-label=${
            this.toggleLabel ||
            (field
              ? fill(messages(this).showOptionsFor, { label: field })
              : messages(this).showOptions)
          }
          aria-expanded=${this.open}
          aria-controls="list"
          ?disabled=${disabled}
          @mousedown=${(event: Event) => event.preventDefault()}
          @click=${() => this.#toggle()}
        >
          ${chevron}
        </button>
      </div>
      ${fieldMessage}
      <div
        part="listbox"
        id="list"
        role="listbox"
        popover="manual"
        aria-label=${ifDefined(name)}
        aria-labelledby=${labelledby}
        @mousedown=${(event: Event) => event.preventDefault()}
        @pointerover=${this.#onPointerover}
      >
        <slot></slot>
        ${
          add
            ? html`<pl-option
                part="action"
                action
                @click=${() => this.#choose(this.#builtin!)}
                >${fill(this.actionLabel || messages(this).addQuery, {
                  query,
                })}</pl-option
              >`
            : nothing
        }
        ${
          empty
            ? html`<div
                part="empty"
                role="option"
                aria-disabled="true"
                aria-selected="false"
              >
                ${this.emptyLabel || messages(this).noResults}
              </div>`
            : nothing
        }
      </div>`;
  }
}

customElements.define("pl-combobox", PlCombobox);

declare global {
  interface HTMLElementTagNameMap {
    "pl-combobox": PlCombobox;
  }
}
