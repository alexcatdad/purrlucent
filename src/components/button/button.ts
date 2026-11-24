import { LitElement, html, nothing } from "lit";
import { interactionStyles } from "../../behaviors/interaction.css.ts";
import { LensController } from "../../behaviors/lens.ts";
import { PressableController } from "../../behaviors/pressable.ts";
import "../spinner/spinner.ts";
import { buttonStyles } from "./button.css.ts";

export type PlButtonVariant = "primary" | "secondary" | "tinted" | "ghost";
export type PlButtonSize = "md" | "lg" | "xl";

/**
 * A button. The label is the slotted text and is required for an accessible
 * name; an `icon` button takes an `aria-label` instead. A destructive button
 * never takes the filled primary look. With `type="submit"` or `type="reset"`
 * it submits or resets the form it is in; the default `button` does neither.
 *
 * In a dialog, `default` marks the button Return activates (not from a
 * multi-line text field) and `cancel` the one Escape or Command-Period
 * activates. The default button draws as primary unless it has another
 * variant. A destructive button cannot be the default; the dialog warns.
 *
 * @attr {boolean} default - The dialog's default button: Return activates it, it draws as primary and it takes initial focus.
 * @attr {boolean} cancel - The dialog's cancel button: Escape and Command-Period activate it.
 * @attr {boolean} busy - The action is running: a spinner shows before the label, the button ignores presses and stays focusable.
 * @fires pl-press - When the button is activated by pointer, Enter or Space.
 * @slot - The button label, with an optional leading svg icon.
 * @csspart label - The wrapper around the label.
 */
export class PlButton extends LitElement {
  static formAssociated = true;
  static override styles = [interactionStyles, buttonStyles];
  static override properties = {
    variant: { reflect: true },
    type: { reflect: true },
    size: { reflect: true },
    icon: { type: Boolean, reflect: true },
    destructive: { type: Boolean, reflect: true },
    default: { type: Boolean, reflect: true },
    cancel: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    busy: { type: Boolean, reflect: true },
  };

  declare variant: PlButtonVariant;
  declare type: "button" | "submit" | "reset";
  declare size: PlButtonSize;
  declare icon: boolean;
  declare destructive: boolean;
  declare default: boolean;
  declare cancel: boolean;
  declare disabled: boolean;
  declare busy: boolean;

  // :disabled also covers a disabled fieldset around the button.
  readonly pressable = new PressableController(this, {
    disabled: () => this.busy || this.matches(":disabled"),
  });
  #off = false;
  #tabindex: string | null = null;

  constructor() {
    super();
    new LensController(this);
    this.variant = "secondary";
    this.type = "button";
    this.size = "md";
    this.icon = false;
    this.destructive = false;
    this.default = false;
    this.cancel = false;
    this.disabled = false;
    this.busy = false;
    // Like a native button: submit or reset the form the button belongs to.
    this.addEventListener("pl-press", () => {
      const { form } = this.pressable.internals;
      if (this.type === "submit") form?.requestSubmit();
      else if (this.type === "reset") form?.reset();
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "button");
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  // After the update, so a changed `disabled` attribute is already reflected.
  // A tabindex set from outside (a roving group) is kept and restored.
  protected override updated() {
    if (this.busy) this.setAttribute("aria-busy", "true");
    else this.removeAttribute("aria-busy");
    const off = this.matches(":disabled");
    if (off !== this.#off) {
      this.#off = off;
      if (off) {
        this.#tabindex = this.getAttribute("tabindex");
        this.tabIndex = -1;
        this.setAttribute("aria-disabled", "true");
      } else {
        if (this.#tabindex === null) this.removeAttribute("tabindex");
        else this.setAttribute("tabindex", this.#tabindex);
        this.removeAttribute("aria-disabled");
      }
    }
    if (!off && !this.hasAttribute("tabindex")) this.tabIndex = 0;
  }

  override render() {
    return html`<span part="label"
      >${
        this.busy
          ? html`<pl-spinner size="sm" aria-hidden="true"></pl-spinner>`
          : nothing
      }<slot></slot
    ></span>`;
  }
}

customElements.define("pl-button", PlButton);

declare global {
  interface HTMLElementTagNameMap {
    "pl-button": PlButton;
  }
}
