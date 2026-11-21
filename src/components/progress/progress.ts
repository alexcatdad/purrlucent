import { LitElement, html, type PropertyValues } from "lit";
import { progressStyles } from "./progress.css.ts";

/**
 * A progress bar. With a `value` it shows how far along the work is; without
 * one it shows that work is going on. Name it with `label`.
 *
 * @attr {number} value - How much is done, from 0 to `max`. Leave it out for indeterminate.
 * @attr {number} max - The value that means done. Defaults to 100.
 * @attr {string} label - The accessible name.
 * @csspart fill - The done part of the bar, or the moving segment when indeterminate.
 */
export class PurrProgress extends LitElement {
  static override styles = progressStyles;
  static override properties = {
    value: { type: Number },
    max: { type: Number },
    label: {},
  };

  declare value: number | undefined;
  declare max: number;
  declare label: string;

  readonly #internals = this.attachInternals();

  constructor() {
    super();
    this.max = 100;
    this.label = "";
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "progressbar");
  }

  protected override updated(changed: PropertyValues<this>) {
    const max = this.max > 0 ? this.max : 100;
    const determinate =
      typeof this.value === "number" && !Number.isNaN(this.value);
    const value = determinate ? Math.min(max, Math.max(0, this.value!)) : 0;
    this.setAttribute("aria-valuemin", "0");
    this.setAttribute("aria-valuemax", String(max));
    if (determinate) this.setAttribute("aria-valuenow", String(value));
    else this.removeAttribute("aria-valuenow");
    if (this.label) this.setAttribute("aria-label", this.label);
    else if (changed.get("label")) this.removeAttribute("aria-label");
    this.style.setProperty("--_p", String(value / max));
    if (determinate) this.#internals.states.delete("indeterminate");
    else this.#internals.states.add("indeterminate");
  }

  override render() {
    return html`<span part="fill"></span>`;
  }
}

customElements.define("purr-progress", PurrProgress);

declare global {
  interface HTMLElementTagNameMap {
    "purr-progress": PurrProgress;
  }
}
