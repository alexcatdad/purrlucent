import { LitElement, html, type PropertyValues } from "lit";
import { sectionStyles } from "./sidebar.css.ts";

/**
 * A titled group of `pl-sidebar-item` children inside a `pl-sidebar`. The
 * group is exposed to assistive technology under its `label`, so the visible
 * heading is not read a second time.
 *
 * @slot - `pl-sidebar-item` children.
 * @csspart heading - The visible heading.
 */
export class PlSidebarSection extends LitElement {
  static override styles = sectionStyles;
  static override properties = { label: { type: String } };

  /** The heading and the accessible name of the group. */
  declare label: string;

  constructor() {
    super();
    this.label = "";
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "group");
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has("label")) {
      if (this.label) this.setAttribute("aria-label", this.label);
      else this.removeAttribute("aria-label");
    }
  }

  override render() {
    return html`<div class="heading" part="heading" aria-hidden="true">
        ${this.label}
      </div>
      <slot></slot>`;
  }
}

customElements.define("pl-sidebar-section", PlSidebarSection);

declare global {
  interface HTMLElementTagNameMap {
    "pl-sidebar-section": PlSidebarSection;
  }
}
