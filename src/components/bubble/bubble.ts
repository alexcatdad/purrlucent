import { LitElement, html, nothing } from "lit";
import { errorGlyph } from "../../behaviors/glyphs.ts";
import { bubbleStyles, groupStyles, reactionsStyles } from "./bubble.css.ts";

/**
 * A chat message bubble. It sizes to its content up to 80% of its container
 * (`--pl-bubble-max-inline-size`); `ghost` is unframed and full width, for
 * assistant text, markdown and code. The bubble never parses markdown: slot
 * the rendered content. An `href` makes the body a link, `interactive` a
 * button; reactions stay outside both, so no control nests in another.
 *
 * The `destructive` variant draws an error mark beside the text; the message
 * itself must say what went wrong, as color is not the only cue.
 *
 * @attr {string} variant - `default` (strong accent, for the person's own messages), `secondary`, `muted`, `tinted`, `outline`, `ghost` or `destructive`.
 * @attr {string} align - `start` (default) or `end`.
 * @attr {string} href - Makes the body a link to this address.
 * @attr {string} target - Where the link opens, as on `a`.
 * @attr {string} rel - The link's relationship, as on `a`.
 * @attr {boolean} interactive - Makes the body a button. Listen for `click`.
 * @slot - The message content.
 * @slot reactions - A `pl-bubble-reactions` over the bubble's edge.
 * @csspart body - The filled shape: a link, a button or a div.
 * @csspart content - The slotted content.
 * @cssprop [--pl-bubble-max-inline-size=80%] - The widest the bubble grows.
 */
export class PlBubble extends LitElement {
  static override styles = bubbleStyles;
  static override properties = {
    variant: { reflect: true },
    align: { reflect: true },
    href: { reflect: true },
    target: {},
    rel: {},
    interactive: { type: Boolean, reflect: true },
  };

  declare variant:
    | "default"
    | "secondary"
    | "muted"
    | "tinted"
    | "outline"
    | "ghost"
    | "destructive";
  declare align: "start" | "end";
  declare href: string | null;
  declare target: string | null;
  declare rel: string | null;
  declare interactive: boolean;

  constructor() {
    super();
    this.variant = "default";
    this.align = "start";
    this.href = null;
    this.target = null;
    this.rel = null;
    this.interactive = false;
  }

  override render() {
    const body = html`${this.variant === "destructive" ? errorGlyph : nothing}<span
        part="content"
        ><slot></slot
      ></span>`;
    return html`${
        this.href
          ? html`<a
              part="body"
              href=${this.href}
              target=${this.target ?? nothing}
              rel=${this.rel ?? nothing}
              >${body}</a
            >`
          : this.interactive
            ? html`<button part="body" type="button">${body}</button>`
            : html`<div part="body">${body}</div>`
      }<slot name="reactions"></slot>`;
  }
}

/**
 * The reactions on a bubble, a pill that overlaps the bubble's top or bottom
 * edge. Alone it is one image named by `label` (or, without one, by its text),
 * so a screen reader hears "3 likes" and not each emoji. With `interactive` it
 * is a group, and each slotted `button` is a real control with its own name.
 *
 * @attr {string} side - `bottom` (default) or `top`: the bubble edge it overlaps.
 * @attr {string} align - `end` (default) or `start`: where along that edge.
 * @attr {string} label - The summary read out, such as "2 likes, 1 laugh". Without `interactive`, give emoji or icons one.
 * @attr {boolean} interactive - The children are buttons.
 * @slot - The reactions: text or icons, or `button` elements when interactive.
 */
export class PlBubbleReactions extends LitElement {
  static override styles = reactionsStyles;
  static override properties = {
    side: { reflect: true },
    align: { reflect: true },
    label: {},
    interactive: { type: Boolean, reflect: true },
  };

  declare side: "top" | "bottom";
  declare align: "start" | "end";
  declare label: string | null;
  declare interactive: boolean;

  #role = "";
  // Text bound or streamed in place fires no slotchange, so watch it.
  #observer = new MutationObserver(() => this.requestUpdate());

  constructor() {
    super();
    this.side = "bottom";
    this.align = "end";
    this.label = null;
    this.interactive = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#observer.observe(this, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  // Attributes, so they show in every engine's accessibility tree. An
  // author's own role is kept; only our own value is replaced.
  protected override willUpdate() {
    if (this.hasAttribute("role") && this.getAttribute("role") !== this.#role) {
      return;
    }
    this.#role = this.interactive ? "group" : "img";
    this.setAttribute("role", this.#role);
    const name =
      this.label ??
      (this.interactive ? "" : (this.textContent ?? "").replace(/\s+/g, " "));
    if (name.trim()) this.setAttribute("aria-label", name.trim());
    else this.removeAttribute("aria-label");
  }

  override render() {
    return html`<slot @slotchange=${() => this.requestUpdate()}></slot>`;
  }
}

/**
 * A run of consecutive bubbles from one sender. The neighbors' touching
 * corners are tight, and the gap between them is small. Name the group with
 * `label` when it needs one, such as the sender.
 *
 * @attr {string} label - The group's accessible name.
 * @slot - `pl-bubble` elements.
 */
export class PlBubbleGroup extends LitElement {
  static override styles = groupStyles;
  static override properties = { label: {} };

  declare label: string | null;

  constructor() {
    super();
    this.label = null;
  }

  protected override willUpdate() {
    if (this.label) {
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", this.label);
    } else {
      this.removeAttribute("role");
      this.removeAttribute("aria-label");
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("pl-bubble", PlBubble);
customElements.define("pl-bubble-reactions", PlBubbleReactions);
customElements.define("pl-bubble-group", PlBubbleGroup);

declare global {
  interface HTMLElementTagNameMap {
    "pl-bubble": PlBubble;
    "pl-bubble-reactions": PlBubbleReactions;
    "pl-bubble-group": PlBubbleGroup;
  }
}
