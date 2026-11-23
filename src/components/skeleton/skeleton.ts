import { LitElement } from "lit";
import { skeletonStyles } from "./skeleton.css.ts";

/**
 * A placeholder shown in the place of content that is still loading. It is
 * hidden from assistive technology by default, so mark the loading region
 * itself with `aria-busy="true"` and clear it when the content arrives. Size it
 * with `inline-size` and `block-size`. Replace it with the real content as soon
 * as that is ready.
 *
 * @attr {string} shape - `rect` (default) or `circle`.
 * @attr {boolean} shimmer - A light band sweeps across it. It stops when the user asks for less motion.
 */
export class PlSkeleton extends LitElement {
  static override styles = skeletonStyles;
  static override properties = {
    shape: { reflect: true },
    shimmer: { type: Boolean, reflect: true },
  };

  declare shape: "rect" | "circle";
  declare shimmer: boolean;

  constructor() {
    super();
    this.shape = "rect";
    this.shimmer = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("aria-hidden"))
      this.setAttribute("aria-hidden", "true");
  }
}

customElements.define("pl-skeleton", PlSkeleton);

declare global {
  interface HTMLElementTagNameMap {
    "pl-skeleton": PlSkeleton;
  }
}
