import { LitElement, html, svg } from "lit";
import { panelSurface } from "../../surfaces/surfaces.css.ts";
import { bannerStyles } from "./banner.css.ts";

const closeGlyph = svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>`;

/**
 * A notification banner: an icon, a title, a message, optional actions and a
 * close button. It is a live region (`status`, or `alert` for the destructive
 * tone) and never takes focus when it appears. The close button hides the
 * banner and fires `purr-close`.
 *
 * @attr {boolean} open - The banner is showing.
 * @attr {string} tone - `info` (default) or `destructive`.
 * @attr {string} close-label - The close button's accessible name. Defaults to "Dismiss".
 * @slot icon - An `svg` shown as a tile.
 * @slot title - The heading.
 * @slot - The message.
 * @slot actions - Buttons below the message.
 * @csspart text - The title and message.
 * @csspart close - The close button.
 * @fires purr-close - The user closed the banner.
 */
export class PurrBanner extends LitElement {
  static override styles = [panelSurface, bannerStyles];
  static override properties = {
    open: { type: Boolean, reflect: true },
    tone: { reflect: true },
    closeLabel: { attribute: "close-label" },
  };

  declare open: boolean;
  declare tone: "info" | "destructive";
  declare closeLabel: string;

  readonly #internals = this.attachInternals();

  constructor() {
    super();
    this.open = false;
    this.tone = "info";
    this.closeLabel = "Dismiss";
  }

  // Default semantics, so an author's own role wins and the role exists from
  // the first render.
  protected override willUpdate() {
    this.#internals.role = this.tone === "destructive" ? "alert" : "status";
  }

  #close() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("purr-close", { bubbles: true, composed: true }),
    );
  }

  override render() {
    return html`<slot name="icon"></slot>
      <div part="text">
        <div part="title"><slot name="title"></slot></div>
        <slot></slot>
      </div>
      <button
        part="close"
        type="button"
        aria-label=${this.closeLabel}
        @click=${this.#close}
      >
        ${closeGlyph}
      </button>
      <div part="actions"><slot name="actions"></slot></div>`;
  }
}

customElements.define("purr-banner", PurrBanner);

declare global {
  interface HTMLElementTagNameMap {
    "purr-banner": PurrBanner;
  }
}
