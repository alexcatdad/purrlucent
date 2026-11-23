import { LitElement, html, nothing, svg, type PropertyValues } from "lit";
import { backGlyph } from "../../behaviors/glyphs.ts";
import { carouselItemStyles, carouselStyles } from "./carousel.css.ts";

const nextGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6 6.5-6 6.5" /></svg>`;

/** The scroll has settled when no scroll event has come for this long, in ms. */
const settleDelay = 150;

const fill = (template: string, values: Record<string, number>) =>
  (template ?? "").replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

/**
 * One slide of a `pl-carousel`, one page wide. The carousel gives it its
 * "n of m" name.
 *
 * @slot - The slide's content.
 */
export class PlCarouselItem extends LitElement {
  static override styles = carouselItemStyles;

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "group");
    this.setAttribute("aria-roledescription", "slide");
  }

  override render() {
    return html`<slot></slot>`;
  }
}

/**
 * A row of slides that scrolls with the browser's own scrolling and CSS
 * scroll-snap: swipe, trackpad and keyboard scrolling all work. Previous and
 * Next buttons and a dot for each page sit centered below. It does not
 * autoplay and does not wrap: Previous is disabled on the first page and Next
 * on the last. The current page's dot is marked `aria-current="true"`.
 *
 * It follows the WAI-ARIA carousel pattern without rotation. The host is a
 * `region` described as a "carousel" and named by `label`; each `pl-carousel-item`
 * is a `group` described as a "slide" and named "n of m". Under reduced motion
 * the buttons and dots jump instead of gliding. With the focus on the
 * scrolling area, the arrow keys, Home and End change the page.
 *
 * Each item is one page wide. Use it for peer content browsed in order, such as
 * images or cards; for a few labelled views use `pl-tabs`.
 *
 * @attr {string} label - The accessible name of the carousel. Always set one.
 * @attr {string} previous-label - The accessible name of the Previous button. Defaults to "Previous slide".
 * @attr {string} next-label - The accessible name of the Next button. Defaults to "Next slide".
 * @attr {string} page-label - The accessible name of a page's dot; `{page}` is its number. Defaults to "Go to slide {page}".
 * @attr {string} slide-label - The name of each slide; `{page}` is its number and `{total}` the count. Defaults to "{page} of {total}".
 * @fires {CustomEvent<{ index: number }>} pl-change - The current page changed after a scroll settled. `detail.index` is the zero-based page.
 * @slot - The `pl-carousel-item` slides.
 * @csspart viewport - The scrolling area.
 * @csspart controls - The row of Previous, dots and Next.
 * @csspart previous - The Previous button.
 * @csspart next - The Next button.
 * @csspart pages - The list of dots.
 * @csspart page - A page's dot.
 * @csspart current - The current page's dot, besides `page`.
 */
export class PlCarousel extends LitElement {
  static override styles = carouselStyles;
  static override properties = {
    label: {},
    previousLabel: { attribute: "previous-label" },
    nextLabel: { attribute: "next-label" },
    pageLabel: { attribute: "page-label" },
    slideLabel: { attribute: "slide-label" },
    index: { state: true },
    count: { state: true },
  };

  declare label: string;
  declare previousLabel: string;
  declare nextLabel: string;
  declare pageLabel: string;
  declare slideLabel: string;
  /** The current page, from 0. Change it with `goTo`. */
  declare index: number;
  declare count: number;

  #frame = 0;
  #timer = 0;
  #reported = 0;
  #focusedStep: "previous" | "next" | null = null;

  constructor() {
    super();
    this.label = "";
    this.previousLabel = "Previous slide";
    this.nextLabel = "Next slide";
    this.pageLabel = "Go to slide {page}";
    this.slideLabel = "{page} of {total}";
    this.index = 0;
    this.count = 0;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "region");
    this.setAttribute("aria-roledescription", "carousel");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.#frame);
    clearTimeout(this.#timer);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has("label")) {
      if (this.label) this.setAttribute("aria-label", this.label);
      else {
        this.removeAttribute("aria-label");
        console.warn("pl-carousel needs a label.");
      }
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has("slideLabel")) this.#nameSlides();
    // A step button that was focused may have just become disabled at an end.
    const step = this.#focusedStep;
    if (!step) return;
    const root = this.renderRoot;
    if (root.querySelector<HTMLButtonElement>(`[part=${step}]`)?.disabled) {
      const other = step === "next" ? "previous" : "next";
      this.#focusedStep = other;
      root.querySelector<HTMLElement>(`[part=${other}]`)?.focus();
    }
  }

  get #viewport() {
    return this.renderRoot.querySelector<HTMLElement>('[part="viewport"]')!;
  }

  get #items() {
    return [
      ...this.querySelectorAll<PlCarouselItem>(":scope > pl-carousel-item"),
    ];
  }

  #nameSlides() {
    const items = this.#items;
    items.forEach((item, i) =>
      item.setAttribute(
        "aria-label",
        fill(this.slideLabel, { page: i + 1, total: items.length }),
      ),
    );
  }

  /** The item whose center is nearest the viewport's center. */
  #nearest() {
    const view = this.#viewport.getBoundingClientRect();
    const middle = view.left + view.width / 2;
    let best = 0;
    let distance = Infinity;
    this.#items.forEach((item, i) => {
      const box = item.getBoundingClientRect();
      const d = Math.abs(box.left + box.width / 2 - middle);
      if (d < distance) {
        distance = d;
        best = i;
      }
    });
    return best;
  }

  #onSlotChange() {
    this.count = this.#items.length;
    this.#nameSlides();
    this.index = Math.min(this.#nearest(), Math.max(this.count - 1, 0));
    this.#reported = this.index;
  }

  #onScroll() {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => {
      this.index = this.#nearest();
    });
    clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => this.#settle(), settleDelay);
  }

  /** The scroll came to rest: report the page, once, if it changed. */
  #settle() {
    clearTimeout(this.#timer);
    cancelAnimationFrame(this.#frame);
    this.index = this.#nearest();
    if (this.index === this.#reported) return;
    this.#reported = this.index;
    this.dispatchEvent(
      new CustomEvent("pl-change", {
        detail: { index: this.index },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Scrolls to a page, instantly under reduced motion. Out of range is clamped. */
  goTo(index: number) {
    const item = this.#items[Math.min(Math.max(index, 0), this.count - 1)];
    if (!item) return;
    const viewport = this.#viewport;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({
      left:
        viewport.scrollLeft +
        item.getBoundingClientRect().left -
        viewport.getBoundingClientRect().left,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  #onKeydown(event: KeyboardEvent) {
    // Keys from slotted content, such as a text field, are not ours.
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey)
      return;
    const rtl = getComputedStyle(this).direction === "rtl";
    const steps: Record<string, number> = {
      ArrowRight: rtl ? -1 : 1,
      ArrowLeft: rtl ? 1 : -1,
    };
    const step = steps[event.key];
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? this.count - 1
          : step === undefined
            ? undefined
            : this.index + step;
    if (target === undefined) return;
    event.preventDefault();
    this.goTo(target);
  }

  #onFocusIn(event: FocusEvent) {
    const part = (event.target as HTMLElement).getAttribute("part");
    this.#focusedStep = part === "previous" || part === "next" ? part : null;
  }

  /** Focus left the step buttons for elsewhere; a button disabling itself does not count. */
  #onFocusOut(event: FocusEvent) {
    const controls = event.currentTarget as HTMLElement;
    const from = event.target as HTMLButtonElement;
    if (from.disabled || controls.contains(event.relatedTarget as Node | null))
      return;
    this.#focusedStep = null;
  }

  override render() {
    const { index, count } = this;
    return html`<div
        part="viewport"
        tabindex="0"
        @scroll=${this.#onScroll}
        @scrollend=${this.#settle}
        @keydown=${this.#onKeydown}
      >
        <slot @slotchange=${this.#onSlotChange}></slot>
      </div>
      <div
        part="controls"
        ?hidden=${count < 2}
        @focusin=${this.#onFocusIn}
        @focusout=${this.#onFocusOut}
      >
        <button
          part="previous"
          type="button"
          aria-label=${this.previousLabel ?? ""}
          ?disabled=${index <= 0}
          @click=${() => this.goTo(index - 1)}
        >
          ${backGlyph}
        </button>
        <ul part="pages" role="list">
          ${Array.from(
            { length: count },
            (_, i) =>
              html`<li>
                <button
                  part=${i === index ? "page current" : "page"}
                  type="button"
                  aria-label=${fill(this.pageLabel, { page: i + 1 })}
                  aria-current=${i === index ? "true" : nothing}
                  @click=${() => this.goTo(i)}
                ></button>
              </li>`,
          )}
        </ul>
        <button
          part="next"
          type="button"
          aria-label=${this.nextLabel ?? ""}
          ?disabled=${index >= count - 1}
          @click=${() => this.goTo(index + 1)}
        >
          ${nextGlyph}
        </button>
      </div>`;
  }
}

customElements.define("pl-carousel-item", PlCarouselItem);
customElements.define("pl-carousel", PlCarousel);

declare global {
  interface HTMLElementTagNameMap {
    "pl-carousel-item": PlCarouselItem;
    "pl-carousel": PlCarousel;
  }
}
