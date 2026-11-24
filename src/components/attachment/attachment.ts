import { LitElement, html, nothing, type PropertyValues } from "lit";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { attachmentGroupStyles, attachmentStyles } from "./attachment.css.ts";
import { messages, type PlMessages } from "../../behaviors/locale.ts";

export type PlAttachmentState =
  "idle" | "uploading" | "processing" | "error" | "done";
export type PlAttachmentSize = "default" | "sm" | "xs";

const stateText: Partial<Record<PlAttachmentState, keyof PlMessages>> = {
  uploading: "uploading",
  processing: "processing",
  error: "error",
};

// Controls that take a tab stop of their own, so the group needs none.
const interactive =
  "[href], [clickable], a[href], button, input, select, textarea, pl-button, [tabindex]:not([tabindex^='-'])";

/**
 * A file or other item attached to a message or a draft: media, a title, a
 * description and actions. With an `href` or `clickable` the whole card is one
 * target, named by the title; buttons in the `actions` slot stay separate. While
 * `uploading` or `processing` the title shimmers (still under reduced motion),
 * and in `error` the card uses the destructive colors; keep the reason in the
 * description text, since color alone does not say it. A hidden status word is
 * added to the title's name for the states that need one.
 *
 * @attr {string} state - `idle`, `uploading`, `processing`, `error` or `done` (default). Idle looks like done.
 * @attr {string} media - What the `media` slot holds: `icon` (default) in a tile, or `image`, which fills it.
 * @attr {string} size - `default`, `sm` or `xs`.
 * @attr {string} orientation - `horizontal` (default) or `vertical`, with the media above the text.
 * @attr {string} href - Makes the card a link to this address.
 * @attr {string} target - Where the link opens, as on `a`.
 * @attr {string} rel - The link's relationship, as on `a`.
 * @attr {boolean} clickable - Makes the card a button that fires `pl-press`. Ignored when there is an `href`.
 * @attr {string} status-label - The hidden word added to the name while the state is `uploading`, `processing` or `error`. Set it when the page is not in English.
 * @fires {CustomEvent<{}>} pl-press - When a `clickable` card is activated by pointer, Enter or Space. Presses of buttons in the `actions` slot do not reach the card.
 * @slot media - An svg icon, or an image when `media="image"`. Give an image `alt=""` when the title says the same.
 * @slot title - The attachment's name. It names the link or button when the card is one.
 * @slot description - Secondary text, such as the size or, in `error`, the reason.
 * @slot actions - Icon buttons, each with an `aria-label` that names the action and the attachment. They stay separate from the card's own target.
 * @csspart trigger - The link or button, when the card is one.
 * @csspart text - The title and description.
 */
export class PlAttachment extends LitElement {
  static override styles = attachmentStyles;
  static override properties = {
    state: { reflect: true },
    media: { reflect: true },
    size: { reflect: true },
    orientation: { reflect: true },
    href: { reflect: true },
    target: {},
    rel: {},
    clickable: { type: Boolean, reflect: true },
    statusLabel: { attribute: "status-label" },
  };

  declare state: PlAttachmentState;
  declare media: "icon" | "image";
  declare size: PlAttachmentSize;
  declare orientation: "horizontal" | "vertical";
  declare href: string | null;
  declare target: string | null;
  declare rel: string | null;
  declare clickable: boolean;
  declare statusLabel: string | null;

  constructor() {
    super();
    this.state = "done";
    this.media = "icon";
    this.size = "default";
    this.orientation = "horizontal";
    this.href = null;
    this.target = null;
    this.rel = null;
    this.clickable = false;
    this.statusLabel = null;
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has("state")) {
      if (this.state === "uploading" || this.state === "processing")
        this.setAttribute("aria-busy", "true");
      else this.removeAttribute("aria-busy");
    }
  }

  #press() {
    this.dispatchEvent(
      new CustomEvent("pl-press", {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    );
  }

  override render() {
    const word = stateText[this.state ?? "done"];
    const title = html`<span part="title"><slot name="title"></slot></span
      >${word ? html`<span part="status">${this.statusLabel || messages(this)[word]}</span>` : nothing}`;
    return html`<div part="media" hidden>
        <slot name="media" @slotchange=${hideWhenEmpty}></slot>
      </div>
      <div part="text">
        ${
          this.href
            ? html`<a
                part="trigger"
                href=${this.href}
                target=${this.target ?? nothing}
                rel=${this.rel ?? nothing}
                >${title}</a
              >`
            : this.clickable
              ? html`<button part="trigger" type="button" @click=${this.#press}>
                  ${title}
                </button>`
              : html`<div part="label">${title}</div>`
        }
        <slot name="description"></slot>
      </div>
      <div part="actions" hidden>
        <slot
          name="actions"
          @slotchange=${hideWhenEmpty}
          @pl-press=${(e: Event) => e.stopPropagation()}
        ></slot>
      </div>`;
  }
}

/**
 * A row of attachments that scrolls sideways and snaps each card to the start.
 * A fade marks each edge that has more to scroll to. Give it a `label`. When it
 * overflows and nothing in it takes focus (no link, button or action), the row
 * takes a tab stop so the keyboard can scroll it.
 *
 * @attr {string} label - The accessible name of the group.
 * @slot - The attachments.
 */
export class PlAttachmentGroup extends LitElement {
  static override styles = attachmentGroupStyles;
  static override properties = {
    label: {},
  };

  declare label: string;

  #resize = new ResizeObserver(() => this.#sync());
  #mutation = new MutationObserver(() => this.#sync());
  #addedTabindex = false;

  constructor() {
    super();
    this.label = "";
    this.addEventListener("scroll", () => this.#sync(), { passive: true });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.#resize.observe(this);
    this.#mutation.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["tabindex", "disabled", "hidden", "href", "clickable"],
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
    this.#mutation.disconnect();
  }

  protected override updated() {
    if (this.label) this.setAttribute("aria-label", this.label);
    else this.removeAttribute("aria-label");
    this.#sync();
  }

  #sync() {
    const max = this.scrollWidth - this.clientWidth;
    const x = this.scrollLeft;
    const rtl = this.matches(":dir(rtl)");
    // Physical sides: in rtl the scroll offset is zero at the right and negative leftwards.
    this.toggleAttribute("data-more-left", rtl ? max + x > 1 : x > 1);
    this.toggleAttribute("data-more-right", rtl ? x < -1 : max - x > 1);
    const needsStop =
      max > 1 &&
      ![...this.querySelectorAll<HTMLElement>(interactive)].some(
        (el) => !el.matches(":disabled"),
      );
    if (needsStop && !this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
      this.#addedTabindex = true;
    } else if (!needsStop && this.#addedTabindex) {
      this.removeAttribute("tabindex");
      this.#addedTabindex = false;
    }
  }

  override render() {
    return html`<slot @slotchange=${() => this.#sync()}></slot>`;
  }
}

customElements.define("pl-attachment", PlAttachment);
customElements.define("pl-attachment-group", PlAttachmentGroup);

declare global {
  interface HTMLElementTagNameMap {
    "pl-attachment": PlAttachment;
    "pl-attachment-group": PlAttachmentGroup;
  }
}
