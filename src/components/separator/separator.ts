import { LitElement } from "lit";
import { separatorStyles } from "./separator.css.ts";

/**
 * A hairline rule between groups of content. By default it is decoration and
 * assistive technology skips it (`role="none"`). Set `semantic` when it divides
 * content that a screen reader user should know is divided; it then has
 * `role="separator"` and `aria-orientation`.
 *
 * @attr {string} orientation - `horizontal` (default) or `vertical`. A vertical rule fills the height of a flex or grid row.
 * @attr {boolean} semantic - Expose it as a separator instead of hiding it from assistive technology.
 */
export class PlSeparator extends LitElement {
  static override styles = separatorStyles;
  static override properties = {
    orientation: { reflect: true },
    semantic: { type: Boolean, reflect: true },
  };

  declare orientation: "horizontal" | "vertical";
  declare semantic: boolean;

  constructor() {
    super();
    this.orientation = "horizontal";
    this.semantic = false;
  }

  protected override updated() {
    if (this.semantic) {
      this.setAttribute("role", "separator");
      this.setAttribute(
        "aria-orientation",
        this.orientation === "vertical" ? "vertical" : "horizontal",
      );
    } else {
      this.setAttribute("role", "none");
      this.removeAttribute("aria-orientation");
    }
  }
}

customElements.define("pl-separator", PlSeparator);

declare global {
  interface HTMLElementTagNameMap {
    "pl-separator": PlSeparator;
  }
}
