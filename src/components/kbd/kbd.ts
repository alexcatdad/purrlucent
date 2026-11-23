import { LitElement, html } from "lit";
import { kbdStyles } from "./kbd.css.ts";

/**
 * A key or a shortcut, shown in a keycap style. It is presentational: it takes
 * no focus and does nothing when pressed. Write a shortcut as symbols with the
 * modifiers in the order Control, Option, Shift, Command and the key last, for
 * example `⌃⌥⇧⌘K`, or use one element for each key.
 *
 * @slot - The key text, for example `⌘K` or `Esc`.
 * @csspart key - The `kbd` element.
 */
export class PlKbd extends LitElement {
  static override styles = kbdStyles;

  override render() {
    return html`<kbd part="key"><slot></slot></kbd>`;
  }
}

customElements.define("pl-kbd", PlKbd);

declare global {
  interface HTMLElementTagNameMap {
    "pl-kbd": PlKbd;
  }
}
