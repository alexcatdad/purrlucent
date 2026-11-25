import { LitElement, html, nothing } from "lit";
import { badgeStyles } from "./badge.css.ts";

/**
 * A small label for a count or a status. It is presentational and takes no
 * focus. The text always carries the meaning, so a status badge says its status
 * in words; the variant only adds color. Put a count in context in the
 * surrounding text, for example "Inbox" before a badge reading "3".
 *
 * @attr {string} variant - `neutral` (default), `accent`, `success`, `warning` or `destructive`.
 * @attr {string} appearance - `solid` (default), `soft` (a tinted fill under tone-colored text) or `outline` (an edge in the tone, no fill).
 * @attr {boolean} dot - A status pill: the badge keeps the neutral fill and the variant colors a dot before the text.
 * @slot - The badge text.
 * @csspart dot - The status dot, shown with `dot`.
 * @csspart label - The text.
 */
export class PlBadge extends LitElement {
  static override styles = badgeStyles;
  static override properties = {
    variant: { reflect: true },
    appearance: { reflect: true },
    dot: { type: Boolean, reflect: true },
  };

  declare variant: "neutral" | "accent" | "success" | "warning" | "destructive";
  declare appearance: "solid" | "soft" | "outline";
  declare dot: boolean;

  readonly #internals = this.attachInternals();
  // A count (no letters, such as "3" or "99+") keeps the narrow, round badge;
  // text with letters gets room before the rounded ends.
  readonly #watch = new MutationObserver(() => this.#measure());

  constructor() {
    super();
    this.variant = "neutral";
    this.appearance = "solid";
    this.dot = false;
  }

  #measure() {
    if (/\p{L}/u.test(this.textContent ?? ""))
      this.#internals.states.add("text");
    else this.#internals.states.delete("text");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#watch.observe(this, {
      subtree: true,
      characterData: true,
      childList: true,
    });
    this.#measure();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#watch.disconnect();
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
