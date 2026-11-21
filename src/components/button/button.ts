import { LitElement, html, type PropertyValues } from "lit";
import { interactionStyles } from "../../behaviors/interaction.css.ts";
import { PressableController } from "../../behaviors/pressable.ts";
import { buttonStyles } from "./button.css.ts";

export type PurrButtonVariant = "primary" | "secondary" | "tinted" | "ghost";
export type PurrButtonSize = "md" | "lg" | "xl";

/**
 * A button. The label is the slotted text and is required for an accessible
 * name; an `icon` button takes an `aria-label` instead. A destructive button
 * never takes the filled primary look. With `type="submit"` or `type="reset"`
 * it submits or resets the form it is in; the default `button` does neither.
 *
 * @fires purr-press - When the button is activated by pointer, Enter or Space.
 * @slot - The button label, with an optional leading svg icon.
 * @csspart label - The wrapper around the label.
 */
export class PurrButton extends LitElement {
  static formAssociated = true;
  static override styles = [interactionStyles, buttonStyles];
  static override properties = {
    variant: { reflect: true },
    type: { reflect: true },
    size: { reflect: true },
    icon: { type: Boolean, reflect: true },
    destructive: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare variant: PurrButtonVariant;
  declare type: "button" | "submit" | "reset";
  declare size: PurrButtonSize;
  declare icon: boolean;
  declare destructive: boolean;
  declare disabled: boolean;

  readonly pressable = new PressableController(this, {
    disabled: () => this.disabled,
  });

  constructor() {
    super();
    this.variant = "secondary";
    this.type = "button";
    this.size = "md";
    this.icon = false;
    this.destructive = false;
    this.disabled = false;
    // Like a native button: submit or reset the form the button belongs to.
    this.addEventListener("purr-press", () => {
      const { form } = this.pressable.internals;
      if (this.type === "submit") form?.requestSubmit();
      else if (this.type === "reset") form?.reset();
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "button");
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has("disabled")) {
      this.tabIndex = this.disabled ? -1 : 0;
      if (this.disabled) this.setAttribute("aria-disabled", "true");
      else this.removeAttribute("aria-disabled");
    }
  }

  override render() {
    return html`<span part="label"><slot></slot></span>`;
  }
}

customElements.define("purr-button", PurrButton);

declare global {
  interface HTMLElementTagNameMap {
    "purr-button": PurrButton;
  }
}
