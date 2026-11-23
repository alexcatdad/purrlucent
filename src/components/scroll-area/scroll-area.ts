import { LitElement, html, type PropertyValues } from "lit";
import { scrollAreaStyles } from "./scroll-area.css.ts";

const focusable = (el: HTMLElement) =>
  !el.matches(":disabled") &&
  (el.tabIndex >= 0 || Boolean(el.shadowRoot?.delegatesFocus));

/**
 * A region that scrolls its content with the browser's own scrolling: wheel,
 * touch, trackpad and keyboard all work. The scrollbar is thin and drawn from
 * tokens. Give it a size, such as `block-size` or `max-block-size`, so the
 * content has something to overflow. When the content overflows and holds
 * nothing focusable, the region takes focus so the keyboard can scroll it.
 *
 * @attr {string} label - The accessible name of the region.
 * @attr {string} orientation - `vertical` (default), `horizontal` or `both`.
 * @slot - The content to scroll.
 * @csspart content - The wrapper around the content.
 */
export class PlScrollArea extends LitElement {
  static override styles = scrollAreaStyles;
  static override properties = {
    label: {},
    orientation: { reflect: true },
  };

  declare label: string;
  declare orientation: "vertical" | "horizontal" | "both";

  #resize = new ResizeObserver(() => this.#syncFocus());
  #mutation = new MutationObserver(() => this.#syncFocus());
  #addedTabindex = false;

  constructor() {
    super();
    this.label = "";
    this.orientation = "vertical";
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#resize.observe(this);
    const content = this.renderRoot.querySelector("[part=content]");
    if (content) this.#resize.observe(content);
    this.#mutation.observe(this, {
      childList: true,
      subtree: true,
      attributeFilter: ["tabindex", "disabled", "hidden"],
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
    this.#mutation.disconnect();
  }

  protected override firstUpdated() {
    this.#resize.observe(this.renderRoot.querySelector("[part=content]")!);
  }

  protected override updated(changed: PropertyValues<this>) {
    if (this.label) {
      this.setAttribute("role", "region");
      this.setAttribute("aria-label", this.label);
    } else if (changed.get("label")) {
      this.removeAttribute("role");
      this.removeAttribute("aria-label");
    }
    this.#syncFocus();
  }

  /** The region is a tab stop only while it overflows and holds nothing focusable. */
  #syncFocus() {
    // Only the axes that scroll count; the other is clipped.
    const overflows =
      (this.orientation !== "horizontal" &&
        this.scrollHeight > this.clientHeight) ||
      (this.orientation !== "vertical" && this.scrollWidth > this.clientWidth);
    const needsStop =
      overflows &&
      ![...this.querySelectorAll<HTMLElement>("*")].some(focusable);
    if (needsStop && !this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
      this.#addedTabindex = true;
    } else if (!needsStop && this.#addedTabindex) {
      this.removeAttribute("tabindex");
      this.#addedTabindex = false;
    }
  }

  override render() {
    return html`<div part="content"><slot></slot></div>`;
  }
}

customElements.define("pl-scroll-area", PlScrollArea);

declare global {
  interface HTMLElementTagNameMap {
    "pl-scroll-area": PlScrollArea;
  }
}
