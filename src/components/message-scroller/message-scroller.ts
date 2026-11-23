import { LitElement, html, svg, type PropertyValues } from "lit";
import "../button/button.ts";
import {
  messageScrollerButtonStyles,
  messageScrollerItemStyles,
  messageScrollerStyles,
} from "./message-scroller.css.ts";

// The edge fades' two lengths. Registered, they compute to a length, so script
// can read them; registration is document-wide, so it is done here and not in
// the styles. Without it the fades still show.
for (const name of ["--_ms-fade-start", "--_ms-fade-end"]) {
  try {
    CSS.registerProperty({
      name,
      syntax: "<length>",
      inherits: false,
      initialValue: "0px",
    });
  } catch {
    // Registered already, or this engine cannot register properties.
  }
}

export type PlMessageScrollerAlign = "start" | "center" | "end" | "nearest";
export type PlMessageScrollerPosition = "start" | "end" | "last-anchor";

export interface PlMessageScrollerScrollOptions {
  /** `smooth` (default) scrolls in an animation, which reduced motion turns into a jump. */
  behavior?: ScrollBehavior;
}

export interface PlMessageScrollerMessageOptions extends PlMessageScrollerScrollOptions {
  /** Where the message lands: `start` (default, below the previous item's peek), `center`, `end` or `nearest`. */
  align?: PlMessageScrollerAlign;
}

/** Within this many pixels of an edge counts as at the edge; layout rounds fractions. */
const EDGE = 1;

const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

const arrowDown = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></svg>`;

/**
 * A row of a `pl-message-scroller`. It names a message for
 * `scrollToMessage` and can mark where a turn begins. Rows far from the
 * viewport are not laid out or painted (`content-visibility: auto`), so a long
 * transcript stays cheap. The row holds anything: a `pl-message`, a marker, a
 * system notice. Any element in the scroller with `message-id` or
 * `scroll-anchor` works the same; this element only adds the row styles.
 *
 * @attr {string} message-id - A stable id for `scrollToMessage`.
 * @attr {boolean} scroll-anchor - The row starts a turn. When one is added at the end, the scroller scrolls it near the top, leaving a peek of the row before it.
 * @slot - The row content.
 */
export class PlMessageScrollerItem extends LitElement {
  static override styles = messageScrollerItemStyles;
  static override properties = {
    messageId: { attribute: "message-id", reflect: true },
    scrollAnchor: { attribute: "scroll-anchor", type: Boolean, reflect: true },
  };

  declare messageId: string;
  declare scrollAnchor: boolean;

  constructor() {
    super();
    this.messageId = "";
    this.scrollAnchor = false;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("pl-message-scroller-item", PlMessageScrollerItem);

/**
 * A scrolling transcript for a chat. The element is the scroll viewport (a
 * named, focusable region, so the keyboard scrolls it) and holds a `log` that
 * announces added messages. It never scrolls by itself unless asked: a row
 * marked `scroll-anchor` scrolls into place when it is added, `auto-scroll`
 * follows streamed content while the reader is at the end, and
 * `default-scroll-position` picks where it opens. Scrolling away (wheel, touch,
 * the keys that scroll up, the scrollbar, or selecting text) stops the
 * following until the reader returns to the end or calls `scrollToEnd`. Older
 * rows added before the first one keep the visible rows where they are. There
 * is no virtualization; the rows use `content-visibility: auto`. The element
 * never parses message content.
 *
 * `data-scrollable` lists the edges the content can still scroll toward:
 * `start`, `end`, both separated by a space, or absent. The edges of the
 * viewport fade where there is more to see.
 *
 * @attr {string} label - The accessible name of the region. Defaults to "Messages".
 * @attr {boolean} busy - A reply is streaming; the log is `aria-busy`, so assistive technology waits for the reply before reading it.
 * @attr {boolean} auto-scroll - Follow new content while the reader is at the end. Off by default.
 * @attr {string} default-scroll-position - Where the first non-empty render opens, once: `start` (default), `end` or `last-anchor`, the last row with `scroll-anchor`, or the end when that row and what follows fit the viewport.
 * @attr {number} peek - Pixels of the previous row left visible above an anchor. Defaults to the 16-spacing-unit token.
 * @attr {string} button-label - The accessible name of the built-in scroll-to-end button. Defaults to "Scroll to latest".
 * @slot - The rows: `pl-message-scroller-item` or any element.
 * @slot button - Replaces the built-in scroll-to-end button, for example a `pl-message-scroller-button` with its own label.
 * @csspart log - The log that holds the rows.
 * @fires {CustomEvent<{ start: boolean, end: boolean }>} pl-scroll - The edges the content can still scroll toward changed. It does not fire on every scroll tick.
 */
export class PlMessageScroller extends LitElement {
  static override styles = messageScrollerStyles;
  static override properties = {
    label: {},
    busy: { type: Boolean, reflect: true },
    autoScroll: { attribute: "auto-scroll", type: Boolean, reflect: true },
    defaultScrollPosition: {
      attribute: "default-scroll-position",
      reflect: true,
    },
    peek: { type: Number },
    buttonLabel: { attribute: "button-label" },
  };

  declare label: string;
  declare busy: boolean;
  declare autoScroll: boolean;
  declare defaultScrollPosition: PlMessageScrollerPosition;
  declare peek: number | null;
  declare buttonLabel: string;

  #resize = new ResizeObserver(() => {
    this.#follow();
    this.#sync();
  });
  #rows = new Set<Element>();
  #head: Element | null = null;
  #headOffset = 0;
  #tail: Element | null = null;
  #placed = false;
  // At the end of the content, as of the last scroll or scroll we asked for.
  #atEnd = true;
  // The reader scrolled away; set before the scroll event arrives.
  #released = false;
  // A smooth scroll to the end is under way; the scroll events on its way are not leaving the end.
  #seeking = false;
  // The anchor that was scrolled into place; it stays there while its reply arrives.
  #hold: Element | null = null;
  // The reply did not yet fill the viewport when the anchor was placed.
  #holdUnfilled = false;
  // The pointer is down on the host itself (its padding or scrollbar).
  #pressed = false;
  // The scroll offset at the last scroll event or slot change.
  #top = 0;
  // Identifies the scroll being settled; any newer scroll or release cancels it.
  #settling = 0;

  constructor() {
    super();
    this.label = "Messages";
    this.busy = false;
    this.autoScroll = false;
    this.defaultScrollPosition = "start";
    this.peek = null;
    this.buttonLabel = "Scroll to latest";
    this.addEventListener("scroll", () => {
      // A scroll while the pointer is down on the host itself is a drag of the
      // scrollbar; overlay scrollbars take no layout width to tell it by.
      if (this.#pressed) this.#release();
      this.#top = this.scrollTop;
      this.#measure();
      this.#sync();
    });
    // Every way the reader scrolls by hand lets go of the content. Letting go
    // is undone at the next frames if the reader is still at the end.
    this.addEventListener("wheel", () => this.#release(), { passive: true });
    this.addEventListener("touchmove", () => this.#release(), {
      passive: true,
    });
    // Keys scroll from the region and from any control inside it, except where
    // they edit text; a press on a button or link with the space bar does not scroll.
    this.addEventListener("keydown", (event) => {
      const target = event.composedPath()[0];
      const edits =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      const scrolls =
        ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(
          event.key,
        ) ||
        (event.key === " " && target === this);
      if (scrolls && !edits) this.#release();
    });
    this.addEventListener("pointerdown", (event) => {
      if (event.composedPath()[0] !== this) return;
      this.#pressed = true;
      const up = () => {
        this.#pressed = false;
        for (const type of ["pointerup", "pointercancel", "mouseup"])
          removeEventListener(type, up);
      };
      for (const type of ["pointerup", "pointercancel", "mouseup"])
        addEventListener(type, up);
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
    document.addEventListener("selectionchange", this.#onSelection);
    this.#resize.observe(this);
    const log = this.renderRoot.querySelector("[part=log]");
    if (log) this.#resize.observe(log);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("selectionchange", this.#onSelection);
    this.#resize.disconnect();
  }

  protected override firstUpdated() {
    this.#resize.observe(this.renderRoot.querySelector("[part=log]")!);
  }

  protected override updated(changed: PropertyValues<this>) {
    const label = this.label ?? "";
    if (label) {
      this.setAttribute("role", "region");
      this.setAttribute("aria-label", label);
    } else if (changed.has("label")) {
      this.removeAttribute("role");
      this.removeAttribute("aria-label");
    }
    if (changed.has("peek")) {
      if (this.peek == null || Number.isNaN(this.peek))
        this.style.removeProperty("--_peek");
      else this.style.setProperty("--_peek", `${this.peek}px`);
    }
  }

  /** The rows: the children that are not slotted elsewhere. */
  #children() {
    return [...this.children].filter((el) => !el.hasAttribute("slot"));
  }

  #max() {
    return Math.max(0, this.scrollHeight - this.clientHeight);
  }

  /** Scroll offset that puts `row` at `align`, from layout as it is now. */
  #topFor(row: Element, align: PlMessageScrollerAlign) {
    const box = row.getBoundingClientRect();
    const top =
      box.top -
      this.getBoundingClientRect().top -
      this.clientTop +
      this.scrollTop;
    const peek =
      parseFloat(getComputedStyle(this).scrollPaddingBlockStart) || 0;
    const start = top - peek;
    const end = top + box.height - this.clientHeight;
    switch (align) {
      case "end":
        return end;
      case "center":
        return top - (this.clientHeight - box.height) / 2;
      case "nearest":
        if (start < this.scrollTop) return start;
        if (end > this.scrollTop) return Math.min(start, end);
        return this.scrollTop;
      default:
        return start;
    }
  }

  #go(top: number, behavior: ScrollBehavior) {
    this.scrollTo({
      top,
      behavior: behavior === "smooth" && reducedMotion() ? "instant" : behavior,
    });
  }

  /**
   * The reader scrolls by hand, or jumps to a message. Content stops following
   * and the anchor stops holding. Input that moves nothing (a wheel at the end)
   * sends no scroll event, so two frames later this is undone if the content
   * is still at its end.
   */
  #release() {
    this.#released = true;
    this.#seeking = false;
    this.#hold = null;
    this.#settling++;
    requestAnimationFrame(() => requestAnimationFrame(() => this.#measure()));
  }

  #onSelection = () => {
    if (this.#selecting()) this.#release();
  };

  #selecting() {
    const selection = getSelection();
    return (
      !!selection &&
      !selection.isCollapsed &&
      (this.contains(selection.anchorNode) ||
        this.contains(selection.focusNode))
    );
  }

  /** Records whether the content is at its end, from where the scroll is now. */
  #measure() {
    const atEnd = this.#max() - this.scrollTop <= EDGE;
    if (atEnd) {
      this.#released = false;
      this.#seeking = false;
    }
    this.#atEnd = atEnd || this.#seeking;
  }

  /** Mirrors the scrollable edges to `data-scrollable` and tells listeners when they change. */
  #sync() {
    const start = this.scrollTop > EDGE;
    const end = this.#max() - this.scrollTop > EDGE;
    const value = [start && "start", end && "end"].filter(Boolean).join(" ");
    if (value === (this.getAttribute("data-scrollable") ?? "")) return;
    if (value) this.setAttribute("data-scrollable", value);
    else this.removeAttribute("data-scrollable");
    this.dispatchEvent(
      new CustomEvent("pl-scroll", {
        detail: { start, end },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #jump(top: number) {
    if (Math.abs(top - this.scrollTop) > EDGE)
      this.scrollTo({ top, behavior: "instant" });
  }

  /**
   * Runs when the content or the viewport changes size. An anchor keeps its
   * place near the top (or, while the content is too short for that, the end)
   * as its reply arrives; with `auto-scroll` the view follows the end instead
   * once that reply fills the viewport. Otherwise it follows the end only while
   * the reader is there.
   */
  #follow() {
    if (this.#released) return;
    if (this.#hold && !this.contains(this.#hold)) this.#hold = null;
    if (this.#hold) {
      const target = this.#topFor(this.#hold, "start");
      const filled = this.#max() > target + EDGE;
      if (!(this.autoScroll && this.#holdUnfilled && filled)) {
        this.#jump(Math.min(target, this.#max()));
        return;
      }
      this.#hold = null;
    }
    if (this.autoScroll && this.#atEnd && !this.#selecting())
      this.#jump(this.#max());
  }

  #onSlot() {
    const rows = this.#children();
    if (!rows.length) {
      this.#rows = new Set();
      this.#head = this.#tail = null;
      this.#sync();
      return;
    }
    const added = rows.filter((row) => !this.#rows.has(row));
    const log = this.renderRoot.querySelector("[part=log]")!;
    const offset = (row: Element) =>
      row.getBoundingClientRect().top - log.getBoundingClientRect().top;

    if (!this.#placed) {
      this.#placed = true;
      this.#place();
    } else {
      // Rows added before the old first row push everything down. Engines with
      // scroll anchoring have moved the offset by now (not at the very top);
      // this makes up what is left, so the visible rows stay where they are.
      const at = this.#head ? rows.indexOf(this.#head) : -1;
      if (at > 0) {
        const shift =
          offset(this.#head!) - this.#headOffset - (this.scrollTop - this.#top);
        if (Math.abs(shift) > 0) this.scrollTop += shift;
      }
      const tail = this.#tail ? rows.indexOf(this.#tail) : -1;
      const anchor = added.findLast(
        (row) => rows.indexOf(row) > tail && row.hasAttribute("scroll-anchor"),
      );
      if (anchor) this.#anchorTo(anchor);
    }
    this.#rows = new Set(rows);
    this.#head = rows[0]!;
    this.#headOffset = offset(this.#head);
    this.#tail = rows.at(-1)!;
    this.#top = this.scrollTop;
    this.#measure();
    this.#sync();
  }

  /** The default scroll position, applied once, then again after the rows' own sizes settle. */
  #place() {
    const top = () => {
      if (this.defaultScrollPosition === "end") return this.#max();
      if (this.defaultScrollPosition !== "last-anchor") return 0;
      const anchor = this.#children().findLast((row) =>
        row.hasAttribute("scroll-anchor"),
      );
      return anchor
        ? Math.min(this.#topFor(anchor, "start"), this.#max())
        : this.#max();
    };
    this.scrollTo({ top: top(), behavior: "instant" });
    // Rows skipped by content-visibility get their real size once seen, and
    // scroll anchoring may move the offset meanwhile; an end or an anchor is
    // corrected until it settles. The start never moves.
    if (this.defaultScrollPosition === "start") return;
    this.#settle(top, () => {
      this.#measure();
      this.#sync();
    });
  }

  /**
   * Scrolls a new anchor near the top, at once: rows below it are skipped by
   * content-visibility and settle to their real size afterwards, and #follow
   * keeps the anchor in place while they do.
   */
  #anchorTo(anchor: Element) {
    const target = this.#topFor(anchor, "start");
    this.#released = false;
    this.#hold = anchor;
    this.#holdUnfilled = this.#max() <= target + EDGE;
    this.#jump(Math.min(target, this.#max()));
  }

  /**
   * Scrolls the message with this `message-id` into view and stops following
   * new content until the reader reaches the end again. Returns `false` when
   * no message has that id.
   */
  scrollToMessage(
    id: string,
    {
      align = "start",
      behavior = "smooth",
    }: PlMessageScrollerMessageOptions = {},
  ): boolean {
    const row = this.#children().find(
      (child) => child.getAttribute("message-id") === id,
    );
    if (!row) return false;
    this.#release();
    this.#go(this.#topFor(row, align), behavior);
    this.#settle(() => this.#topFor(row, align));
    return true;
  }

  /**
   * Once the scroll that was asked for has stopped, measures the target again
   * and corrects the offset. Rows skipped by content-visibility get their real
   * size as they are passed, which moves the target. Any later scroll by the
   * reader, or by another call, cancels it.
   */
  #settle(target: () => number, done?: () => void) {
    const id = ++this.#settling;
    let last = NaN;
    let still = 0;
    let corrections = 0;
    const tick = () => {
      if (id !== this.#settling) return;
      still = Math.abs(this.scrollTop - last) < 0.5 ? still + 1 : 0;
      last = this.scrollTop;
      if (still >= 3) {
        const top = Math.min(Math.max(0, target()), this.#max());
        if (Math.abs(top - this.scrollTop) > EDGE && corrections++ < 5) {
          this.#go(top, "instant");
          still = 0;
        } else {
          done?.();
          return;
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /**
   * Scrolls to the end and follows new content again when `auto-scroll` is on.
   * Returns `false` when the content is already at its end.
   */
  scrollToEnd({
    behavior = "smooth",
  }: PlMessageScrollerScrollOptions = {}): boolean {
    this.#hold = null;
    this.#released = false;
    const top = this.#max();
    const moved = Math.abs(top - this.scrollTop) > EDGE;
    this.#atEnd = true;
    this.#seeking = moved && behavior === "smooth" && !reducedMotion();
    if (moved) {
      this.#go(top, behavior);
      this.#settle(
        () => this.#max(),
        () => {
          this.#seeking = false;
          this.#measure();
          this.#sync();
        },
      );
    }
    return moved;
  }

  /** Scrolls to the start. Returns `false` when the content is already at its start. */
  scrollToStart({
    behavior = "smooth",
  }: PlMessageScrollerScrollOptions = {}): boolean {
    if (this.scrollTop <= EDGE) return false;
    this.#release();
    this.#go(0, behavior);
    return true;
  }

  override render() {
    return html`<div
        part="log"
        role="log"
        aria-relevant="additions"
        aria-busy=${this.busy ? "true" : "false"}
      >
        <slot @slotchange=${this.#onSlot}></slot>
      </div>
      <div part="overlay">
        <slot name="button"
          ><pl-message-scroller-button
            label=${this.buttonLabel}
          ></pl-message-scroller-button
        ></slot>
      </div>`;
  }
}

customElements.define("pl-message-scroller", PlMessageScroller);

/**
 * A button that scrolls its `pl-message-scroller` to the end. The scroller
 * draws one by default; use this element in the `button` slot to give it its
 * own label. It is inert, and not drawn, while there is nothing below to
 * scroll to. After it is pressed, focus moves to the scroller so the keyboard
 * keeps working when the button goes away.
 *
 * @attr {string} label - The accessible name. Defaults to "Scroll to latest".
 */
export class PlMessageScrollerButton extends LitElement {
  static override styles = messageScrollerButtonStyles;
  static override properties = {
    label: {},
  };

  declare label: string;

  #scroller: PlMessageScroller | null = null;

  constructor() {
    super();
    this.label = "Scroll to latest";
  }

  override connectedCallback() {
    super.connectedCallback();
    // Slotted in a scroller: it is an ancestor in this tree. Drawn by the
    // scroller itself: it is the host of the shadow root this sits in.
    const root = this.getRootNode();
    this.#scroller =
      this.parentElement?.closest("pl-message-scroller") ??
      (root instanceof ShadowRoot && root.host instanceof PlMessageScroller
        ? root.host
        : null);
    this.#scroller?.addEventListener("pl-scroll", this.#update);
    this.#update();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#scroller?.removeEventListener("pl-scroll", this.#update);
    this.#scroller = null;
  }

  #update = () => {
    const edges = this.#scroller?.getAttribute("data-scrollable") ?? "";
    const active = edges.split(" ").includes("end");
    this.toggleAttribute("inert", !active);
    this.setAttribute("data-active", String(active));
  };

  #press() {
    this.#scroller?.scrollToEnd();
    this.#scroller?.focus({ preventScroll: true });
  }

  override render() {
    return html`<pl-button
      icon
      aria-label=${this.label ?? ""}
      @pl-press=${this.#press}
      >${arrowDown}</pl-button
    >`;
  }
}

customElements.define("pl-message-scroller-button", PlMessageScrollerButton);

declare global {
  interface HTMLElementTagNameMap {
    "pl-message-scroller": PlMessageScroller;
    "pl-message-scroller-item": PlMessageScrollerItem;
    "pl-message-scroller-button": PlMessageScrollerButton;
  }
}
