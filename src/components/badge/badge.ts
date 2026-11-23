import { LitElement, html } from "lit";
import { badgeStyles } from "./badge.css.ts";

/**
 * A small label for a count or a status. It is presentational and takes no
 * focus. The text always carries the meaning, so a status badge says its status
 * in words; the variant only adds color. Put a count in context in the
 * surrounding text, for example "Inbox" before a badge reading "3".
 *
 * @attr {string} variant - `neutral` (default), `accent` or `destructive`.
 * @slot - The badge text.
 * @csspart label - The text.
 */
export class PlBadge extends LitElement {
  static override styles = badgeStyles;
  static override properties = {
    variant: { reflect: true },
  };

  declare variant: "neutral" | "accent" | "destructive";

  constructor() {
    super();
    this.variant = "neutral";
  }

  override render() {
    return html`<span part="label"><slot></slot></span>`;
  }
}

customElements.define("pl-badge", PlBadge);

declare global {
  interface HTMLElementTagNameMap {
    "pl-badge": PlBadge;
  }
}
