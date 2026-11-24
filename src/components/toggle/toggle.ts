import { PlButton } from "../button/button.ts";
import { toggleStyles } from "./toggle.css.ts";

/**
 * A button that holds an on or off state, announced as `aria-pressed`. It is a
 * `pl-button`, so size, `icon`, `disabled`, the slotted label and the leading
 * svg icon work the same; an `icon` toggle needs an `aria-label`. The button's
 * `variant`, `type` and `destructive` have no use here.
 *
 * @fires {CustomEvent<{ pressed: boolean }>} pl-change - A press is about to change the state, before it is applied. `detail.pressed` holds the new one. Cancelable: `preventDefault()` keeps the current state.
 * @slot - The label, with an optional leading svg icon (filled while on).
 * @csspart label - The wrapper around the label.
 */
export class PlToggle extends PlButton {
  static override styles = [...PlButton.styles, toggleStyles];
  static override properties = {
    ...PlButton.properties,
    pressed: { type: Boolean, reflect: true },
  };

  declare pressed: boolean;

  constructor() {
    super();
    this.pressed = false;
    this.addEventListener("pl-press", () => {
      const pressed = !this.pressed;
      const proceed = this.dispatchEvent(
        new CustomEvent("pl-change", {
          detail: { pressed },
          bubbles: true,
          composed: true,
          cancelable: true,
        }),
      );
      if (proceed) this.pressed = pressed;
    });
  }

  protected override updated() {
    super.updated();
    this.setAttribute("aria-pressed", String(this.pressed));
  }
}

customElements.define("pl-toggle", PlToggle);

declare global {
  interface HTMLElementTagNameMap {
    "pl-toggle": PlToggle;
  }
}
