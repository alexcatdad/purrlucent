import { LitElement, html, nothing } from "lit";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { markerStyles } from "./marker.css.ts";

export type PlMarkerVariant = "default" | "border" | "separator";

/**
 * A row in a conversation that is not a message: a status such as "Thinking…"
 * or "Explored 4 files", a system note, or a labelled separator such as
 * "Today". It has no role of its own. Set `role="status"` on a row that
 * reports live progress so assistive technology announces it. Do not set
 * `role="separator"` on the separator variant: that role would hide the label
 * from screen readers. The icon is decorative and hidden from them.
 *
 * With an `href` the row is a link; with `interactive` it is a button. Listen
 * for `click` on the element. The icon and the label are then one control.
 *
 * @attr {string} variant - `default`, `border` (a rule under the row) or `separator` (the label centered between two rules).
 * @attr {boolean} shimmer - A dimmer band sweeps across the text, in reading direction. It is plain text under reduced motion and forced colors, and where the browser cannot clip a background to text.
 * @attr {string} href - Makes the row a link to this address.
 * @attr {string} target - Where the link opens, as on `a`.
 * @attr {string} rel - The link's relationship, as on `a`.
 * @attr {boolean} interactive - Makes the row a button. Ignored when there is an `href`.
 * @slot icon - A decorative icon; it is given `aria-hidden="true"`. A `pl-spinner` marks work in progress.
 * @slot - The text.
 * @csspart icon - The wrapper around the icon.
 * @csspart label - The wrapper around the text.
 * @csspart control - The link or button, when the row is one.
 */
export class PlMarker extends LitElement {
  static override styles = markerStyles;
  static override properties = {
    variant: { reflect: true },
    shimmer: { type: Boolean, reflect: true },
    href: { reflect: true },
    target: {},
    rel: {},
    interactive: { type: Boolean, reflect: true },
  };

  declare variant: PlMarkerVariant;
  declare shimmer: boolean;
  declare href: string | null;
  declare target: string | null;
  declare rel: string | null;
  declare interactive: boolean;

  constructor() {
    super();
    this.variant = "default";
    this.shimmer = false;
    this.href = null;
    this.target = null;
    this.rel = null;
    this.interactive = false;
  }

  // aria-hidden on the shadow wrapper does not reach slotted elements in every
  // engine, so a pl-spinner icon would still be read as a progress bar.
  #onIcon = (event: Event) => {
    hideWhenEmpty(event);
    for (const icon of (event.target as HTMLSlotElement).assignedElements())
      icon.setAttribute("aria-hidden", "true");
  };

  override render() {
    const content = html`<span part="icon" aria-hidden="true" hidden
        ><slot name="icon" @slotchange=${this.#onIcon}></slot></span
      ><span part="label" class=${this.shimmer ? "pl-shimmer" : nothing}
        ><slot></slot
      ></span>`;
    if (this.href)
      return html`<a
        part="control"
        href=${this.href}
        target=${this.target ?? nothing}
        rel=${this.rel ?? nothing}
        >${content}</a
      >`;
    if (this.interactive)
      return html`<button part="control" type="button">${content}</button>`;
    return content;
  }
}

customElements.define("pl-marker", PlMarker);

declare global {
  interface HTMLElementTagNameMap {
    "pl-marker": PlMarker;
  }
}
