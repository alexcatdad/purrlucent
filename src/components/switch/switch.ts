import { LitElement, html } from "lit";
import { fireNative } from "../../behaviors/native-events.ts";
import { nativeMessage } from "../../behaviors/native-message.ts";
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
 * @fires {CustomEvent<{ checked: boolean }>} pl-change - The user turned the switch on or off. `detail.checked` holds the new state.
 * @fires input - After pl-change, as a native switch fires it.
 * @fires change - After input, as a native switch fires it.
 */
export class PlSwitch extends LitElement {
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
  /** Always `checkbox`, as on a native switch, so form libraries read `checked`. */
  readonly type = "checkbox";

  // :disabled also covers a disabled fieldset around the switch. Space toggles
  // it; Enter does not, as with a native switch.
  readonly pressable = new PressableController(this, {
    disabled: () => this.matches(":disabled"),
    enter: false,
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
    this.addEventListener("pl-press", () => {
      this.checked = !this.checked;
      // Now, not in updated(): a pl-change listener reads form value and validity.
      this.#syncChecked();
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
    if (!this.hasAttribute("role")) this.setAttribute("role", "switch");
    // Not slotchange: it misses an edit to the text of an assigned text node.
    this.#labelObserver.observe(this, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    this.#syncLabelled();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#labelObserver.disconnect();
  }

  formResetCallback() {
    this.checked = this.hasAttribute("checked");
  }

  formStateRestoreCallback(state: string) {
    this.checked = state === "true";
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  // After the update, so a changed `disabled` attribute is already reflected.
  protected override updated() {
    const disabled = this.matches(":disabled");
    // No tabindex at all, so a click does not focus it, as with a native input.
    if (disabled) this.removeAttribute("tabindex");
    else this.tabIndex = 0;
    if (disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    if (this.required) this.setAttribute("aria-required", "true");
    else this.removeAttribute("aria-required");
    this.#syncChecked();
  }

  #syncChecked() {
    this.setAttribute("aria-checked", String(this.checked));
    if (this.checked) this.#internals.states.add("checked");
    else this.#internals.states.delete("checked");
    // The state string is what formStateRestoreCallback receives.
    this.#internals.setFormValue(
      this.checked ? this.value : null,
      String(this.checked),
    );
    this.#internals.setValidity(
      { valueMissing: this.required && !this.checked },
      nativeMessage("checkbox", "Turn this on to continue."),
    );
  }

  #syncLabelled = () => {
    if (this.textContent?.trim()) this.#internals.states.add("labelled");
    else this.#internals.states.delete("labelled");
  };

  #labelObserver = new MutationObserver(this.#syncLabelled);

  override render() {
    return html`<span part="track"><span part="thumb"></span></span
      ><span part="label"><slot></slot></span>`;
  }
}

customElements.define("pl-switch", PlSwitch);

declare global {
  interface HTMLElementTagNameMap {
    "pl-switch": PlSwitch;
  }
}
