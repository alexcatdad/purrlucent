import { LitElement, html, nothing, svg } from "lit";
import {
  closeGlyph,
  errorGlyph,
  successGlyph,
  warningGlyph,
} from "../../behaviors/glyphs.ts";
import { panelSurface } from "../../surfaces/surfaces.css.ts";
import { bannerStyles } from "./banner.css.ts";
import { messages } from "../../behaviors/locale.ts";

const infoGlyph = svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>`;

const glyphs = {
  info: infoGlyph,
  success: successGlyph,
  warning: warningGlyph,
  destructive: errorGlyph,
};

/**
 * A notification banner: an icon, a title, a message, optional actions and a
 * close button. It is a live region (`status`, or `alert` for the destructive
 * tone) and never takes focus when it appears. The close button hides the
 * banner and fires `pl-close`.
 *
 * @attr {boolean} open - The banner is showing.
 * @attr {string} tone - `info` (default), `success`, `warning` or `destructive`.
 * @attr {string} close-label - The close button's accessible name. Defaults to the page language's text (see `setMessages`), in English "Dismiss".
 * @attr {boolean} no-icon - Shows no icon, not the tone's own either.
 * @attr {boolean} no-close - Shows no close button, for a banner that stays until its cause is gone, such as a lost connection.
 * @slot icon - An `svg` shown as a tile. Without one, the tone draws its own: information for `info`, a check for `success`, a triangle for `warning`, an error mark for `destructive`.
 * @slot title - The heading.
 * @slot - The message.
 * @slot actions - Buttons below the message.
 * @csspart text - The title and message.
 * @csspart close - The close button.
 * @fires pl-close - The user closed the banner.
 */
export class PlBanner extends LitElement {
  static override styles = [panelSurface, bannerStyles];
  static override properties = {
    open: { type: Boolean, reflect: true },
    tone: { reflect: true },
    closeLabel: { attribute: "close-label" },
    noIcon: { type: Boolean, reflect: true, attribute: "no-icon" },
    noClose: { type: Boolean, reflect: true, attribute: "no-close" },
  };

  declare open: boolean;
  declare tone: "info" | "success" | "warning" | "destructive";
  declare closeLabel: string;
  declare noIcon: boolean;
  declare noClose: boolean;

  #role = "";

  constructor() {
    super();
    this.open = false;
    this.tone = "info";
    this.closeLabel = "";
    this.noIcon = false;
    this.noClose = false;
  }

  // A role attribute, so it shows in the DOM and in the accessibility tree of
  // every engine. An author's own role is kept; only our own value is replaced.
  protected override willUpdate() {
    if (this.hasAttribute("role") && this.getAttribute("role") !== this.#role) {
      return;
    }
    this.#role = this.tone === "destructive" ? "alert" : "status";
    this.setAttribute("role", this.#role);
  }

  #close() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("pl-close", { bubbles: true, composed: true }),
    );
  }

  override render() {
    return html`${
        this.noIcon
          ? nothing
          : html`<slot name="icon">${glyphs[this.tone] ?? infoGlyph}</slot>`
      }
      <div part="text">
        <div part="title"><slot name="title"></slot></div>
        <slot></slot>
      </div>
      ${
        this.noClose
          ? nothing
          : html`<button
              part="close"
              type="button"
              aria-label=${this.closeLabel || messages(this).dismiss}
              @click=${this.#close}
            >
              ${closeGlyph}
            </button>`
      }
      <div part="actions"><slot name="actions"></slot></div>`;
  }
}

customElements.define("pl-banner", PlBanner);

declare global {
  interface HTMLElementTagNameMap {
    "pl-banner": PlBanner;
  }
}
