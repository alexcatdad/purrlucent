import { LitElement, html } from "lit";
import { panelStyles } from "./resizable.css.ts";

let count = 0;

/**
 * One pane of a `pl-resizable` group. Sizes are percentages of the group.
 *
 * @attr {number} size - The starting size in percent. Panels without one share what the others leave. The `size` property then follows the layout, 0 while collapsed.
 * @attr {number} min - The smallest size in percent. Defaults to 10.
 * @attr {number} max - The largest size in percent. Defaults to 100.
 * @attr {boolean} collapsible - The divider's Enter key collapses and restores the panel.
 * @attr {boolean} collapsed - The panel is hidden and the others fill its space. Set it to collapse or restore the panel from your own button or shortcut. The last open panel does not collapse.
 * @slot - The panel's content.
 */
export class PlResizablePanel extends LitElement {
  static override styles = panelStyles;
  static override properties = {
    size: { type: Number },
    min: { type: Number },
    max: { type: Number },
    collapsible: { type: Boolean },
    collapsed: { type: Boolean, reflect: true },
  };

  declare size: number | undefined;
  declare min: number;
  declare max: number;
  declare collapsible: boolean;
  declare collapsed: boolean;

  constructor() {
    super();
    this.min = 10;
    this.max = 100;
    this.collapsible = false;
    this.collapsed = false;
  }

  // The divider's aria-controls points here.
  override connectedCallback() {
    super.connectedCallback();
    this.id ||= `pl-resizable-panel-${++count}`;
  }

  protected override updated() {
    this.style.setProperty(
      "--_s",
      String(this.collapsed ? 0 : (this.size ?? 1)),
    );
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("pl-resizable-panel", PlResizablePanel);

declare global {
  interface HTMLElementTagNameMap {
    "pl-resizable-panel": PlResizablePanel;
  }
}
