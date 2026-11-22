import { LitElement, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { DismissController } from "../../behaviors/dismiss.ts";
import { labelText } from "../../behaviors/labels.ts";
import { matchIndex } from "./match.ts";
import { PopupController } from "./popup.ts";
import { listboxStyles, optionStyles, selectStyles } from "./select.css.ts";

const TYPE_AHEAD_MS = 500;

/**
 * One choice in a `purr-select`. Its text is the label. The select marks the
 * chosen option with `aria-selected`; this element does nothing alone.
 *
 * @attr {string} value - What the select submits when this option is chosen. Defaults to the label.
 * @attr {boolean} selected - The select's starting choice.
 * @attr {boolean} disabled - Cannot be chosen.
 * @slot - The label.
 * @csspart check - The check mark shown on the chosen option.
 */
export class PurrOption extends LitElement {
  static override styles = optionStyles;
  static override properties = {
    value: { reflect: true },
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    chosen: { state: true },
  };

  declare value: string;
  declare selected: boolean;
  declare disabled: boolean;
  declare chosen: boolean;

  constructor() {
    super();
    this.value = "";
    this.selected = false;
    this.disabled = false;
    this.chosen = false;
  }

  get label(): string {
    return this.textContent?.trim() ?? "";
  }

  get optionValue(): string {
    return this.value || this.label;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "option");
    this.tabIndex = -1;
  }

  protected override updated() {
    this.setAttribute("aria-selected", String(this.chosen));
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
  }

  override render() {
    return html`<svg part="check" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12l5 5l10 -10" /></svg
      ><slot></slot>`;
  }
}

/**
 * A pop-up button: shows the chosen option and opens a list to choose another.
 * It follows the select-only combobox pattern: the trigger is a combobox and
 * the options are real light-DOM children, so focus moves to the options
 * while the list is open and returns to the trigger on close. It takes part
 * in forms: it submits `name` with the chosen value, a form reset returns it
 * to the option marked `selected`, and a disabled fieldset disables it. A
 * `slot="label"` element is a visible label that names the trigger; without
 * it, `label` becomes the accessible name, and without both a native
 * `<label for>` names it.
 *
 * @attr {string} value - The chosen option's value. Empty when nothing is chosen.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} label - The accessible name when there is no slotted label.
 * @attr {string} placeholder - Shown while nothing is chosen.
 * @attr {boolean} required - The form is invalid while nothing is chosen.
 * @attr {boolean} disabled - No focus, no list, nothing submitted.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {boolean} open - The list is showing.
 * @slot - The `purr-option` children.
 * @slot label - The visible label.
 * @csspart label - The visible label.
 * @csspart trigger - The combobox that shows the choice.
 * @csspart value - The chosen label or the placeholder.
 * @csspart glyph - The up-down arrows.
 * @csspart listbox - The popup.
 * @fires purr-change - The user chose another option. `detail.value` holds its value.
 */
export class PurrSelect extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = [selectStyles, listboxStyles];
  static override properties = {
    value: { reflect: true },
    name: { reflect: true },
    label: { reflect: true },
    placeholder: { reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    size: { reflect: true },
    open: { type: Boolean, reflect: true },
    _labelled: { state: true },
  };

  declare value: string;
  declare name: string;
  declare label: string;
  declare placeholder: string;
  declare required: boolean;
  declare disabled: boolean;
  declare size: "md" | "lg" | "xl";
  declare open: boolean;
  declare _labelled: boolean;

  readonly #internals = this.attachInternals();
  #query = "";
  #timer: ReturnType<typeof setTimeout> | undefined;
  #focusOnOpen: PurrOption | undefined;
  #start: string | undefined;
  readonly #watch = new MutationObserver(() => {
    this.#syncLabelled();
    this.requestUpdate();
  });
  readonly #popup = new PopupController(
    this,
    () => this.#trigger,
    () => this.#listbox,
  );

  constructor() {
    super();
    this.value = "";
    this.name = "";
    this.label = "";
    this.placeholder = "";
    this.required = false;
    this.disabled = false;
    this.size = "md";
    this.open = false;
    this._labelled = false;
    new DismissController(this, {
      enabled: () => this.open,
      onDismiss: (reason) => this.#close(reason === "escape"),
    });
    this.addEventListener("keydown", this.#onKeydown);
    this.addEventListener("click", this.#onClick);
    // A label added after the select still names it before it is read out.
    this.addEventListener("focusin", () => this.requestUpdate());
  }

  get #options(): PurrOption[] {
    return [...this.querySelectorAll("purr-option")];
  }

  get #chosen(): PurrOption | undefined {
    return this.value
      ? this.#options.find((o) => o.optionValue === this.value)
      : undefined;
  }

  get #trigger(): HTMLElement {
    return this.shadowRoot!.querySelector("[part=trigger]")!;
  }

  get #listbox(): HTMLElement {
    return this.shadowRoot!.querySelector("[part=listbox]")!;
  }

  formResetCallback() {
    this.value = this.#start ?? "";
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  #close(refocus: boolean) {
    this.open = false;
    if (refocus) this.#trigger.focus();
  }

  #choose(option: PurrOption) {
    if (option.disabled) return;
    const changed = option.optionValue !== this.value;
    this.value = option.optionValue;
    this.#close(true);
    if (changed) {
      this.dispatchEvent(
        new CustomEvent("purr-change", {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  #onClick = (event: Event) => {
    const option = (event.target as Element).closest("purr-option");
    if (option) this.#choose(option);
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (this.matches(":disabled") || event.ctrlKey || event.metaKey) return;
    const { key } = event;
    const options = this.#options.filter((o) => !o.disabled);
    const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
    const current = options.findIndex((o) => o === active);
    const go = (option: PurrOption | undefined) => {
      event.preventDefault();
      if (this.open) option?.focus();
      else {
        this.#focusOnOpen = option;
        this.open = true;
      }
    };

    if (key === "Tab") {
      if (this.open) this.#close(true);
    } else if (key === "Escape") {
      // Keeps an enclosing dialog open; the dismiss behavior closes the list.
      if (this.open) event.preventDefault();
    } else if (key === "ArrowDown" || key === "ArrowUp") {
      go(
        this.open
          ? options[current + (key === "ArrowDown" ? 1 : -1)]
          : undefined,
      );
    } else if (key === "Home" || key === "End") {
      go(key === "Home" ? options[0] : options.at(-1));
    } else if (key === "Enter" || (key === " " && !this.#query)) {
      if (!this.open) go(undefined);
      else {
        event.preventDefault();
        if (options[current]) this.#choose(options[current]);
      }
    } else if (
      key.length === 1 &&
      !event.altKey &&
      (key !== " " || this.#query)
    ) {
      this.#query += key;
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => (this.#query = ""), TYPE_AHEAD_MS);
      const hit = matchIndex(
        options.map((o) => o.label),
        this.#query,
        this.open ? current : options.indexOf(this.#chosen!),
      );
      if (hit >= 0) go(options[hit]);
    }
  };

  #onSlotChange = () => {
    if (this.#start === undefined) {
      this.#start =
        this.value || this.#options.find((o) => o.selected)?.optionValue || "";
      this.value = this.#start;
    }
    this.requestUpdate();
  };

  override connectedCallback() {
    super.connectedCallback();
    // Slotchange does not fire when an option's text changes; setting
    // textContent replaces the text node (childList), typing edits it (characterData).
    this.#watch.observe(this, {
      subtree: true,
      characterData: true,
      childList: true,
    });
    this.#syncLabelled();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watch.disconnect();
  }

  protected override willUpdate() {
    if (this.open && this.matches(":disabled")) this.open = false;
  }

  // Watches the light DOM: editing a slotted label's text fires no slotchange.
  #syncLabelled() {
    this._labelled = !!this.querySelector(
      ":scope > [slot=label]",
    )?.textContent?.trim();
  }

  protected override updated() {
    if (this._labelled) this.#internals.states.add("labelled");
    else this.#internals.states.delete("labelled");
    const chosen = this.#chosen;
    for (const option of this.#options) option.chosen = option === chosen;
    this.#internals.setFormValue(chosen ? this.value : null);
    this.#internals.setValidity(
      { valueMissing: this.required && !chosen },
      "Choose an option to continue.",
      this.#trigger,
    );
    if (this.#popup.sync(this.open)) {
      (
        this.#focusOnOpen ??
        chosen ??
        this.#options.find((o) => !o.disabled)
      )?.focus();
      this.#focusOnOpen = undefined;
    }
  }

  override render() {
    const chosen = this.#chosen;
    const disabled = this.matches(":disabled");
    const name = this._labelled
      ? undefined
      : this.label || labelText(this.#internals.labels);
    const labelledby = this._labelled ? "label" : nothing;
    // Not a <button>: WebKit leaves buttons out of the Tab order, a select is in it.
    return html`<label part="label" id="label"
        ><slot name="label"></slot
      ></label>
      <div
        part="trigger"
        role="combobox"
        tabindex=${disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded=${this.open}
        aria-controls="list"
        aria-label=${ifDefined(name)}
        aria-labelledby=${labelledby}
        aria-required=${this.required ? "true" : nothing}
        aria-disabled=${disabled ? "true" : nothing}
        @click=${() => !disabled && (this.open = !this.open)}
      >
        <span part="value" class=${chosen ? "" : "placeholder"}
          >${chosen?.label ?? this.placeholder}</span
        >${html`<svg part="glyph" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 9l4 -4l4 4" />
          <path d="M16 15l-4 4l-4 -4" />
        </svg>`}
      </div>
      <div
        part="listbox"
        id="list"
        role="listbox"
        popover="manual"
        aria-label=${ifDefined(name)}
        aria-labelledby=${labelledby}
      >
        <slot @slotchange=${this.#onSlotChange}></slot>
      </div>`;
  }
}

customElements.define("purr-option", PurrOption);
customElements.define("purr-select", PurrSelect);

declare global {
  interface HTMLElementTagNameMap {
    "purr-option": PurrOption;
    "purr-select": PurrSelect;
  }
}
