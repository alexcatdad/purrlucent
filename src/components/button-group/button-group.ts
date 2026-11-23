import { LitElement, html } from "lit";
import { buttonGroupStyles } from "./button-group.css.ts";

/**
 * A set of related `pl-button` elements joined into one shape: the borders
 * meet and only the outer corners are round. It is layout and a label only. It
 * holds no selection and fires no events; each button keeps its own press, tab
 * stop and form behavior. For one choice from a set use `pl-toggle-group`.
 * Always set `label` (or `aria-label`): without either the group has no
 * accessible name. Give the buttons in a group equal weight: one size, one
 * variant.
 *
 * @attr {string} label - The accessible name of the group.
 * @attr {string} orientation - `horizontal` (default) or `vertical`.
 * @slot - `pl-button` elements.
 */
export class PlButtonGroup extends LitElement {
  static override styles = [buttonGroupStyles];
  static override properties = {
    label: { type: String },
    orientation: { reflect: true },
  };
  declare label: string;
  declare orientation: "horizontal" | "vertical";
  /** True while the group's own aria-label is set, so a consumer's is never removed. */
  #owned = false;

  constructor() {
    super();
    this.label = "";
    this.orientation = "horizontal";
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  protected override updated() {
    if (this.label) {
      this.setAttribute("aria-label", this.label);
      this.#owned = true;
    } else if (this.#owned) {
      this.removeAttribute("aria-label");
      this.#owned = false;
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("pl-button-group", PlButtonGroup);

declare global {
  interface HTMLElementTagNameMap {
    "pl-button-group": PlButtonGroup;
  }
}
