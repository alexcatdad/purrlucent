import { LitElement } from "lit";
import { handleStyles } from "./resizable.css.ts";

/**
 * The divider between two panels of a `pl-resizable` group, following the
 * WAI-ARIA window splitter pattern: a focusable `separator` whose value is the
 * size of the panel before it. The group sets its `aria-valuenow`,
 * `aria-valuemin`, `aria-valuemax`, `aria-controls` and `aria-orientation`,
 * and handles the pointer and the keys.
 *
 * @attr {string} label - The accessible name. Defaults to "Resize".
 * @attr {boolean} disabled - The divider cannot be moved, collapses nothing and takes no focus.
 */
export class PlResizableHandle extends LitElement {
  static override styles = handleStyles;
  static override properties = {
    label: {},
    disabled: { type: Boolean, reflect: true },
    // Set by the group to its own orientation.
    orientation: { reflect: true },
  };

  declare label: string;
  declare disabled: boolean;
  declare orientation: "horizontal" | "vertical";

  readonly #internals = this.attachInternals();

  constructor() {
    super();
    this.label = "";
    this.disabled = false;
    this.orientation = "horizontal";
  }

  /** Set by the group while the divider is being dragged. */
  set dragging(on: boolean) {
    if (on) this.#internals.states.add("dragging");
    else this.#internals.states.delete("dragging");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "separator");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.dragging = false;
  }

  protected override updated() {
    this.setAttribute("aria-label", this.label || "Resize");
    this.tabIndex = this.disabled ? -1 : 0;
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
  }
}

customElements.define("pl-resizable-handle", PlResizableHandle);

declare global {
  interface HTMLElementTagNameMap {
    "pl-resizable-handle": PlResizableHandle;
  }
}
