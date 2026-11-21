import { LitElement, html } from "lit";
import { PressableController } from "../../behaviors/pressable.ts";
import { switchStyles } from "./switch.css.ts";

/**
 * A switch: an on/off setting that takes effect at once. The slotted text is
 * its label and accessible name; without it, set `aria-label`. It takes part
 * in forms like a checkbox: when on it submits `name` with `value`, a form
 * reset returns it to its `checked` attribute, and a disabled fieldset
 * disables it.
 *
 * @attr {boolean} checked - The starting state. The `checked` property holds the current one.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} value - The value submitted when on. Defaults to `on`.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {boolean} required - The form is invalid while the switch is off.
 * @attr {boolean} disabled - No focus, no feedback, nothing submitted.
 * @slot - The label.
 * @csspart track - The groove.
 * @csspart thumb - The knob.
 * @csspart label - The wrapper around the label.
 * @fires purr-change - The user turned the switch on or off. `detail.checked` holds the new state.
 */
export class PurrSwitch extends LitElement {
  static formAssociated = true;
  static override styles = switchStyles;
  static override properties = {
    checked: { type: Boolean },
    name: { reflect: true },
    value: {},
    size: { reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare checked: boolean;
  declare name: string;
  declare value: string;
  declare size: "md" | "lg" | "xl";
  declare required: boolean;
  declare disabled: boolean;

  // :disabled also covers a disabled fieldset around the switch.
  readonly pressable = new PressableController(this, {
    disabled: () => this.matches(":disabled"),
  });
  readonly #internals = this.pressable.internals;

  constructor() {
    super();
    this.checked = false;
    this.name = "";
    this.value = "on";
    this.size = "md";
    this.required = false;
    this.disabled = false;
    this.addEventListener("purr-press", () => {
      this.checked = !this.checked;
      this.dispatchEvent(
        new CustomEvent("purr-change", {
          detail: { checked: this.checked },
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "switch");
  }

  formResetCallback() {
    this.checked = this.hasAttribute("checked");
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  // After the update, so a changed `disabled` attribute is already reflected.
  protected override updated() {
    const disabled = this.matches(":disabled");
    this.tabIndex = disabled ? -1 : 0;
    this.setAttribute("aria-checked", String(this.checked));
    if (disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    if (this.required) this.setAttribute("aria-required", "true");
    else this.removeAttribute("aria-required");
    if (this.checked) this.#internals.states.add("checked");
    else this.#internals.states.delete("checked");
    this.#internals.setFormValue(this.checked ? this.value : null);
    this.#internals.setValidity(
      { valueMissing: this.required && !this.checked },
      "Turn this on to continue.",
    );
  }

  #onSlotChange = (event: Event) => {
    const labelled = (event.target as HTMLSlotElement)
      .assignedNodes()
      .some((node) => node.textContent?.trim());
    if (labelled) this.#internals.states.add("labelled");
    else this.#internals.states.delete("labelled");
  };

  override render() {
    return html`<span part="track"><span part="thumb"></span></span
      ><span part="label"
        ><slot @slotchange=${this.#onSlotChange}></slot
      ></span>`;
  }
}

customElements.define("purr-switch", PurrSwitch);

declare global {
  interface HTMLElementTagNameMap {
    "purr-switch": PurrSwitch;
  }
}
