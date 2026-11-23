import { LitElement, svg, type PropertyValues } from "lit";
import { spinnerStyles } from "./spinner.css.ts";

/**
 * A spinner. Without a `value` it shows that work is going on, with no way to
 * tell how far along. With a `value` it draws a clockwise arc for how much is
 * done and stops turning. Always give it a `label` so it has an accessible name.
 *
 * @attr {string} label - The accessible name, for example "Loading".
 * @attr {string} size - `sm`, `md` (default), `lg` or `xl`.
 * @attr {number} value - How much is done, from 0 to `max`. Leave it out for indeterminate.
 * @attr {number} max - The value that means done. Defaults to 100.
 * @csspart ring - The drawing.
 */
export class PlSpinner extends LitElement {
  static override styles = spinnerStyles;
  static override properties = {
    label: {},
    size: { reflect: true },
    value: { type: Number },
    max: { type: Number },
  };

  declare label: string;
  declare size: "sm" | "md" | "lg" | "xl";
  declare value: number | undefined;
  declare max: number;

  readonly #internals = this.attachInternals();

  constructor() {
    super();
    this.label = "";
    this.size = "md";
    this.max = 100;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "progressbar");
  }

  protected override updated(changed: PropertyValues<this>) {
    if (this.label) this.setAttribute("aria-label", this.label);
    else if (changed.get("label")) this.removeAttribute("aria-label");
    const max = this.max > 0 ? this.max : 100;
    const determinate =
      typeof this.value === "number" && !Number.isNaN(this.value);
    const states = this.#internals.states;
    if (determinate) {
      const value = Math.min(max, Math.max(0, this.value!));
      this.setAttribute("aria-valuemin", "0");
      this.setAttribute("aria-valuemax", String(max));
      this.setAttribute("aria-valuenow", String(value));
      // The ring's path is 100 units long, so the dash is the percentage done.
      this.style.setProperty("--_dash", `${(value / max) * 100} 100`);
      states.add("determinate");
      if (value === 0) states.add("empty");
      else states.delete("empty");
    } else {
      for (const name of ["valuemin", "valuemax", "valuenow"])
        this.removeAttribute(`aria-${name}`);
      this.style.removeProperty("--_dash");
      states.delete("determinate");
      states.delete("empty");
    }
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

customElements.define("pl-spinner", PlSpinner);

declare global {
  interface HTMLElementTagNameMap {
    "pl-spinner": PlSpinner;
  }
}
