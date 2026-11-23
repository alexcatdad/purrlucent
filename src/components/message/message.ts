import { LitElement, html } from "lit";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { messageGroupStyles, messageStyles } from "./message.css.ts";

/**
 * One row of a conversation: an optional avatar beside the content, with a
 * header above and a footer below. It is presentational and has no role of its
 * own. Compose the content from bubbles, markers and attachments; the element
 * never parses or renders markdown.
 *
 * `align="end"` is the person's own message: the row mirrors, so the avatar and
 * the content sit at the inline end. The avatar sits level with the bottom of
 * the content and moves up above the footer when there is one. The header
 * stays start-aligned; the footer follows the message side.
 *
 * Icon-only controls in the `footer` (copy, retry, rate) need an accessible
 * name each: give the `pl-button` an `aria-label`.
 *
 * @attr {string} align - `start` (default) or `end`.
 * @slot avatar - A `pl-avatar`. Give it a `name` so it is named, or leave it decorative.
 * @slot header - A sender name or a time, above the content.
 * @slot - The content: bubbles, markers and attachments, stacked.
 * @slot footer - Status or actions below the content.
 * @csspart avatar - The avatar's wrapper.
 * @csspart header - The header's wrapper.
 * @csspart content - The stack that holds the content.
 * @csspart footer - The footer's wrapper.
 */
export class PlMessage extends LitElement {
  static override styles = messageStyles;
  static override properties = {
    align: { reflect: true },
  };

  declare align: "start" | "end";

  constructor() {
    super();
    this.align = "start";
  }

  override render() {
    return html`<div part="avatar" hidden>
        <slot name="avatar" @slotchange=${hideWhenEmpty}></slot>
      </div>
      <div part="header" hidden>
        <slot name="header" @slotchange=${hideWhenEmpty}></slot>
      </div>
      <div part="content"><slot></slot></div>
      <div part="footer" hidden>
        <slot name="footer" @slotchange=${hideWhenEmpty}></slot>
      </div>`;
  }
}

/**
 * Consecutive messages from one sender, stacked tightly. Only the last
 * message shows its avatar; the earlier ones keep the space, so every bubble
 * lines up. The host is a `group`: set `label` (or `aria-label`) to the
 * sender's name so the group is named.
 *
 * @attr {string} label - The accessible name of the group.
 * @slot - `pl-message` elements from the same sender, with the same `align`.
 */
export class PlMessageGroup extends LitElement {
  static override styles = messageGroupStyles;
  static override properties = {
    label: { type: String },
  };

  declare label: string;
  /** True while the group's own aria-label is set, so a consumer's is never removed. */
  #owned = false;

  constructor() {
    super();
    this.label = "";
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  protected override updated() {
    if (this.label) {
      this.setAttribute("aria-label", this.label);
      this.#owned = true;
    } else if (this.#owned) {
      this.removeAttribute("aria-label");
      this.#owned = false;
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("pl-message", PlMessage);
customElements.define("pl-message-group", PlMessageGroup);

declare global {
  interface HTMLElementTagNameMap {
    "pl-message": PlMessage;
    "pl-message-group": PlMessageGroup;
  }
}
