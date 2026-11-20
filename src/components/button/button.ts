import { LitElement, html, type PropertyValues } from "lit";
import { interactionStyles } from "../../behaviors/interaction.css.ts";
import { PressableController } from "../../behaviors/pressable.ts";
import { buttonStyles } from "./button.css.ts";

export type PurrButtonVariant = "plain" | "bordered" | "prominent";

/**
 * A button. The label is the slotted text and is required for an accessible name.
 * A destructive button never takes the prominent look.
 *
 * @fires purr-press - When the button is activated by pointer, Enter or Space.
 * @slot - The button label.
 * @csspart label - The wrapper around the label.
 */
export class PurrButton extends LitElement {
  static override styles = [interactionStyles, buttonStyles];
  static override properties = {
    variant: { reflect: true },
    destructive: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare variant: PurrButtonVariant;
  declare destructive: boolean;
  declare disabled: boolean;

  readonly pressable = new PressableController(this, {
    disabled: () => this.disabled,
  });

  constructor() {
    super();
    this.variant = "plain";
    this.destructive = false;
    this.disabled = false;
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
