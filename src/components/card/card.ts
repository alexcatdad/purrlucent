import { LitElement, html } from "lit";
import { cardStyles } from "./card.css.ts";

/**
 * A card: a grouped content surface with an optional header, content and
 * footer. It is solid, never glass, and not interactive itself. Put controls
 * in the `actions` or `footer` slots. A section with nothing in it is hidden.
 *
 * @slot title - The heading of the header.
 * @slot description - Secondary text under the title.
 * @slot actions - Controls at the trailing edge of the header.
 * @slot - The content.
 * @slot footer - Controls or notes below the content.
 * @csspart header - The header section.
 * @csspart content - The content section.
 * @csspart footer - The footer section.
 */
export class PlCard extends LitElement {
  static override styles = cardStyles;

  // A section shows only when something is assigned to its slots.
  #sync = () => {
    for (const section of this.renderRoot.querySelectorAll("[part]")) {
      section.toggleAttribute(
        "hidden",
        ![...section.querySelectorAll("slot")].some((slot) =>
          slot
            .assignedNodes({ flatten: true })
            .some((n) => n.nodeType === 1 || n.textContent?.trim()),
        ),
      );
    }
  };

  override render() {
    return html`<div part="header">
        <slot name="title" @slotchange=${this.#sync}></slot>
        <slot name="description" @slotchange=${this.#sync}></slot>
        <slot name="actions" @slotchange=${this.#sync}></slot>
      </div>
      <div part="content"><slot @slotchange=${this.#sync}></slot></div>
      <div part="footer">
        <slot name="footer" @slotchange=${this.#sync}></slot>
      </div>`;
  }

  protected override firstUpdated() {
    this.#sync();
  }
}

customElements.define("pl-card", PlCard);

declare global {
  interface HTMLElementTagNameMap {
    "pl-card": PlCard;
  }
}
