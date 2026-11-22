import { LitElement, html, svg } from "lit";
import { errorGlyph } from "../../behaviors/glyphs.ts";
import { panelSurface } from "../../surfaces/surfaces.css.ts";
import { bannerStyles } from "./banner.css.ts";

const infoGlyph = svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>`;

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
 * @slot icon - An `svg` shown as a tile. Without one, the tone draws its own: information for `info`, an error mark for `destructive`.
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

  #role = "";

  constructor() {
    super();
    this.open = false;
    this.tone = "info";
    this.closeLabel = "Dismiss";
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
      new CustomEvent("purr-close", { bubbles: true, composed: true }),
    );
  }

  override render() {
    return html`<slot name="icon"
        >${this.tone === "destructive" ? errorGlyph : infoGlyph}</slot
      >
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
