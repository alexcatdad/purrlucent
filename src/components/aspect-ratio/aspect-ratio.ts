import { LitElement, html, type PropertyValues } from "lit";
import { aspectRatioStyles } from "./aspect-ratio.css.ts";

const RATIO = /^\s*\d*\.?\d+\s*(\/\s*\d*\.?\d+\s*)?$/;

/**
 * A box that keeps its content at a fixed width-to-height ratio. Slotted media
 * fills the box and is cropped to fit, never stretched.
 *
 * @attr {string} ratio - Width to height, such as `16/9` or `1.5`. Defaults to `1`. An invalid value falls back to `1`.
 * @slot - The media, such as an image, a video or a map.
 */
export class PlAspectRatio extends LitElement {
  static override styles = aspectRatioStyles;
  static override properties = {
    ratio: {},
  };

  declare ratio: string;

  constructor() {
    super();
    this.ratio = "1";
  }

  protected override updated(changed: PropertyValues<this>) {
    if (!changed.has("ratio")) return;
    const valid =
      RATIO.test(this.ratio) &&
      this.ratio.split("/").every((part) => Number.parseFloat(part) > 0);
    this.style.setProperty("--_ratio", valid ? this.ratio.trim() : "1");
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("pl-aspect-ratio", PlAspectRatio);

declare global {
  interface HTMLElementTagNameMap {
    "pl-aspect-ratio": PlAspectRatio;
  }
}
