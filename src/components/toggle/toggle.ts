import { PurrButton } from "../button/button.ts";
import { toggleStyles } from "./toggle.css.ts";

/**
 * A button that holds an on or off state, announced as `aria-pressed`. It is a
 * `purr-button`, so size, `icon`, `disabled`, the slotted label and the leading
 * svg icon work the same; an `icon` toggle needs an `aria-label`. The button's
 * `variant`, `type` and `destructive` have no use here.
 *
 * @fires purr-change - A press changed the state. `detail.pressed` holds the new one.
 * @slot - The label, with an optional leading svg icon (filled while on).
 * @csspart label - The wrapper around the label.
 */
export class PurrToggle extends PurrButton {
  static override styles = [...PurrButton.styles, toggleStyles];
  static override properties = {
    ...PurrButton.properties,
    pressed: { type: Boolean, reflect: true },
  };

  declare pressed: boolean;

  constructor() {
    super();
    this.pressed = false;
    this.addEventListener("purr-press", () => {
      this.pressed = !this.pressed;
      this.dispatchEvent(
        new CustomEvent("purr-change", {
          detail: { pressed: this.pressed },
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  protected override updated() {
    super.updated();
    this.setAttribute("aria-pressed", String(this.pressed));
  }
}

customElements.define("purr-toggle", PurrToggle);

declare global {
  interface HTMLElementTagNameMap {
    "purr-toggle": PurrToggle;
  }
}
