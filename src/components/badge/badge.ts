import { LitElement, html, nothing } from "lit";
import { badgeStyles } from "./badge.css.ts";

/**
 * A small label for a count or a status. It is presentational and takes no
 * focus. The text always carries the meaning, so a status badge says its status
 * in words; the variant only adds color. Put a count in context in the
 * surrounding text, for example "Inbox" before a badge reading "3".
 *
 * @attr {string} variant - `neutral` (default), `accent`, `success`, `warning` or `destructive`.
 * @attr {boolean} dot - A status pill: the badge keeps the neutral fill and the variant colors a dot before the text.
 * @slot - The badge text.
 * @csspart dot - The status dot, shown with `dot`.
 * @csspart label - The text.
 */
export class PlBadge extends LitElement {
  static override styles = badgeStyles;
  static override properties = {
    variant: { reflect: true },
    dot: { type: Boolean, reflect: true },
  };

  declare variant: "neutral" | "accent" | "success" | "warning" | "destructive";
  declare dot: boolean;

  constructor() {
    super();
    this.variant = "neutral";
    this.dot = false;
  }

  override render() {
    return html`${
        this.dot ? html`<span part="dot" aria-hidden="true"></span>` : nothing
      }<span part="label"><slot></slot></span>`;
  }
}

customElements.define("pl-badge", PlBadge);

declare global {
  interface HTMLElementTagNameMap {
    "pl-badge": PlBadge;
  }
}
