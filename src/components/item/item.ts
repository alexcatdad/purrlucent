import { LitElement, html, nothing } from "lit";
import { itemStyles } from "./item.css.ts";

/**
 * A list row: leading media, a title with a description, and trailing actions.
 * With an `href` the whole row is one link and the title is its name. The row
 * is a single tab stop; buttons in the `actions` slot stay reachable and
 * separate.
 *
 * @attr {string} href - Makes the row a link to this address.
 * @attr {string} target - Where the link opens, as on `a`.
 * @attr {string} rel - The link's relationship, as on `a`.
 * @slot media - A leading icon or image. Give an image `alt=""` when the title says the same.
 * @slot title - The row's name. It names the link when there is an `href`.
 * @slot description - Secondary text under the title.
 * @slot actions - Trailing controls. They stay separate from the link.
 * @csspart link - The link, when there is an `href`.
 * @csspart text - The title and description.
 */
export class PlItem extends LitElement {
  static override styles = itemStyles;
  static override properties = {
    href: { reflect: true },
    target: {},
    rel: {},
  };

  declare href: string | null;
  declare target: string | null;
  declare rel: string | null;

  constructor() {
    super();
    this.href = null;
    this.target = null;
    this.rel = null;
  }

  override render() {
    const title = html`<slot name="title"></slot>`;
    return html`<slot name="media"></slot>
      <div part="text">
        ${
          this.href
            ? html`<a
                part="link"
                href=${this.href}
                target=${this.target ?? nothing}
                rel=${this.rel ?? nothing}
                >${title}</a
              >`
            : html`<div part="title">${title}</div>`
        }
        <slot name="description"></slot>
      </div>
      <div part="actions"><slot name="actions"></slot></div>`;
  }
}

customElements.define("pl-item", PlItem);

declare global {
  interface HTMLElementTagNameMap {
    "pl-item": PlItem;
  }
}
