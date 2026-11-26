import { html, LitElement, nothing } from "lit";
import { localeOf } from "../../behaviors/locale.ts";
import { stepIndicatorStyles } from "./step-indicator.css.ts";

/**
 * Shows where a person is in an ordered process. Place it near the current
 * step's heading. The steps are text and the current one carries
 * `aria-current="step"`. Put Back and Continue controls in the form.
 *
 * @attr {string[]} steps - Step labels in order, as a JSON array in HTML or an array assigned to `steps`.
 * @attr {number} current-step - One-based index of the current step. Defaults to 1.
 * @attr {string} label - A short accessible name for the list, such as "Account setup".
 * @csspart list - The ordered list.
 * @csspart step - Each step in the list.
 * @csspart number - The visible number of each step.
 */
export class PlStepIndicator extends LitElement {
  static override styles = stepIndicatorStyles;
  static override properties = {
    steps: { type: Array },
    currentStep: { type: Number, attribute: "current-step", useDefault: true },
    label: {},
  };

  declare steps: readonly string[];
  declare currentStep: number;
  declare label: string;

  constructor() {
    super();
    this.steps = [];
    this.currentStep = 1;
    this.label = "";
  }

  override render() {
    if (!Array.isArray(this.steps) || !this.steps.length) return nothing;
    const number = new Intl.NumberFormat(localeOf(this));
    return html`<ol part="list" role="list" aria-label=${this.label || nothing}>
      ${this.steps.map(
        (step, index) =>
          html`<li
            part="step"
            aria-current=${index + 1 === this.currentStep ? "step" : nothing}
          >
            <span part="number" aria-hidden="true"
              >${number.format(index + 1)}</span
            >
            <span>${step}</span>
          </li>`,
      )}
    </ol>`;
  }
}

customElements.define("pl-step-indicator", PlStepIndicator);

declare global {
  interface HTMLElementTagNameMap {
    "pl-step-indicator": PlStepIndicator;
  }
}
