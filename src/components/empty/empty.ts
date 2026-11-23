import { LitElement, html } from "lit";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { emptyStyles } from "./empty.css.ts";

/**
 * An empty state: an optional icon, a title, a description and an action.
 * Say what is missing and offer one clear next step. It is plain content, not a
 * live region. For work in progress use `pl-spinner`, not this.
 *
 * @slot icon - An `svg` shown above the title. Mark it `aria-hidden="true"`.
 * @slot title - What is missing, for example "No projects".
 * @slot description - Why, or what the person can do about it.
 * @slot action - A button or link for the next step.
 * @csspart icon - The icon tile.
 * @csspart text - The title and description.
 * @csspart action - The action row.
 */
export class PlEmpty extends LitElement {
  static override styles = emptyStyles;

  override render() {
    return html`<div part="icon" hidden>
        <slot name="icon" @slotchange=${hideWhenEmpty}></slot>
      </div>
      <div part="text">
        <div part="title"><slot name="title"></slot></div>
        <slot name="description"></slot>
      </div>
      <div part="action" hidden>
        <slot name="action" @slotchange=${hideWhenEmpty}></slot>
      </div>`;
  }
}

customElements.define("pl-empty", PlEmpty);

declare global {
  interface HTMLElementTagNameMap {
    "pl-empty": PlEmpty;
  }
}
