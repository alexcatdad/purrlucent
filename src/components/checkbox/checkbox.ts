import { LitElement, html } from "lit";
import { fireNative } from "../../behaviors/native-events.ts";
import { nativeMessage } from "../../behaviors/native-message.ts";
import { PressableController } from "../../behaviors/pressable.ts";
import { boxStyles, checkboxStyles } from "./checkbox.css.ts";

/**
 * A checkbox: a choice that is on, off or mixed. The slotted text is its label
 * and accessible name; without it, set `aria-label`. It takes part in forms
 * like a native checkbox: when checked it submits `name` with `value`, a form
 * reset returns it to its `checked` and `indeterminate` attributes, and a
 * disabled fieldset disables it. A click turns it on or off and clears mixed.
 *
 * @attr {boolean} checked - The starting state. The `checked` property holds the current one.
 * @attr {boolean} indeterminate - Starts mixed. The `indeterminate` property holds the current state.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} value - The value submitted when checked. Defaults to `on`.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {boolean} required - The form is invalid while the box is unchecked.
 * @attr {boolean} disabled - No focus, no feedback, nothing submitted.
 * @attr {boolean} readonly - The state shows and submits but a press does not change it.
 * @slot - The label.
 * @csspart box - The drawn box.
 * @csspart label - The wrapper around the label.
 * @fires {CustomEvent<{ checked: boolean }>} pl-change - The user changed the box. `detail.checked` holds the new state.
 * @fires input - After pl-change, as a native checkbox fires it.
 * @fires change - After input, as a native checkbox fires it.
 */
export class PlCheckbox extends LitElement {
  static formAssociated = true;
  static override styles = [boxStyles, checkboxStyles];
  static override properties = {
    checked: { type: Boolean },
    indeterminate: { type: Boolean },
    name: { reflect: true },
    value: {},
    size: { reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
  };

  declare checked: boolean;
  declare indeterminate: boolean;
  declare name: string;
  declare value: string;
  declare size: "md" | "lg" | "xl";
  declare required: boolean;
  declare disabled: boolean;
  declare readonly: boolean;
  /** Always `checkbox`, as on a native checkbox, so form libraries read `checked`. */
  readonly type = "checkbox";

  // :disabled also covers a disabled fieldset around the checkbox. Space
  // toggles it; Enter does not, as with a native checkbox.
  readonly pressable = new PressableController(this, {
    disabled: () => this.matches(":disabled"),
    enter: false,
  });
  readonly #internals = this.pressable.internals;

  constructor() {
    super();
    this.checked = false;
    this.indeterminate = false;
    this.name = "";
    this.value = "on";
    this.size = "md";
    this.required = false;
    this.disabled = false;
    this.readonly = false;
    this.addEventListener("pl-press", () => {
      if (this.readonly) return;
      this.checked = !this.checked;
      this.indeterminate = false;
      this.dispatchEvent(
        new CustomEvent("pl-change", {
          detail: { checked: this.checked },
          bubbles: true,
          composed: true,
        }),
      );
      fireNative(this, "input", "change");
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "checkbox");
  }

  formResetCallback() {
    this.checked = this.hasAttribute("checked");
    this.indeterminate = this.hasAttribute("indeterminate");
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  #state(name: string, on: boolean) {
    if (on) this.#internals.states.add(name);
    else this.#internals.states.delete(name);
  }

  // After the update, so a changed `disabled` attribute is already reflected.
  protected override updated() {
    const disabled = this.matches(":disabled");
    // No tabindex at all: -1 would still let a click or focus() take focus.
    if (disabled) this.removeAttribute("tabindex");
    else this.tabIndex = 0;
    this.setAttribute(
      "aria-checked",
      this.indeterminate ? "mixed" : String(this.checked),
    );
    if (disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    if (this.required) this.setAttribute("aria-required", "true");
    else this.removeAttribute("aria-required");
    if (this.readonly) this.setAttribute("aria-readonly", "true");
    else this.removeAttribute("aria-readonly");
    this.#state("checked", this.checked);
    this.#state("indeterminate", this.indeterminate);
    this.#state("disabled", disabled);
    this.#internals.setFormValue(this.checked ? this.value : null);
    this.#internals.setValidity(
      { valueMissing: this.required && !this.checked },
      nativeMessage("checkbox", "Check this box to continue."),
    );
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
          <path class="check" d="M5 12l5 5l10-10" />
          <path class="dash" d="M7 12h10" /></svg></span
      ><span part="label"
        ><slot @slotchange=${this.#onSlotChange}></slot
      ></span>`;
  }
}

customElements.define("pl-checkbox", PlCheckbox);

declare global {
  interface HTMLElementTagNameMap {
    "pl-checkbox": PlCheckbox;
  }
}
