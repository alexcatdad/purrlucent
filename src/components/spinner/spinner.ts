import { LitElement, svg, type PropertyValues } from "lit";
import { spinnerStyles } from "./spinner.css.ts";

/**
 * A spinner: work is going on, with no way to tell how far along. Always give
 * it a `label` so it has an accessible name.
 *
 * @attr {string} label - The accessible name, for example "Loading".
 * @attr {string} size - `sm`, `md` (default), `lg` or `xl`.
 * @csspart ring - The drawing.
 */
export class PurrSpinner extends LitElement {
  static override styles = spinnerStyles;
  static override properties = {
    label: {},
    size: { reflect: true },
  };

  declare label: string;
  declare size: "sm" | "md" | "lg" | "xl";

  constructor() {
    super();
    this.label = "";
    this.size = "md";
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "progressbar");
  }

  protected override updated(changed: PropertyValues<this>) {
    if (this.label) this.setAttribute("aria-label", this.label);
    else if (changed.get("label")) this.removeAttribute("aria-label");
  }

  override render() {
    return svg`<svg part="ring" viewBox="0 0 32 32" aria-hidden="true"
      ><circle class="track" cx="16" cy="16" r="13" /><circle
        class="arc"
        cx="16"
        cy="16"
        r="13"
        pathLength="100"
      /></svg>`;
  }
}

customElements.define("purr-spinner", PurrSpinner);

declare global {
  interface HTMLElementTagNameMap {
    "purr-spinner": PurrSpinner;
  }
}
