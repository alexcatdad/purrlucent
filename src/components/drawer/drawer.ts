import { LitElement, html, nothing } from "lit";
import { LensController } from "../../behaviors/lens.ts";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { drawerStyles } from "./drawer.css.ts";
import { parseDetents, settle, stepDetent, type Detent } from "./detents.ts";
import { messages } from "../../behaviors/locale.ts";

export type PlDrawerSide = "bottom" | "start" | "end";

// The page behind a modal drawer cannot scroll. The lock is an attribute on
// the root, not an inline style, so it cannot clash with another dialog's.
let locks = 0;
const lockStyles = new CSSStyleSheet();
lockStyles.replaceSync("html[data-pl-drawer-lock] { overflow: hidden; }");

const lockScroll = () => {
  if (locks++ === 0) {
    if (!document.adoptedStyleSheets.includes(lockStyles))
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        lockStyles,
      ];
    document.documentElement.setAttribute("data-pl-drawer-lock", "");
  }
};

const unlockScroll = () => {
  if (--locks === 0)
    document.documentElement.removeAttribute("data-pl-drawer-lock");
};

// Pointer travel before a press on the handle is a drag and not a tap.
const slop = 4;
// A release this long after the last movement carries no flick.
const flickWindow = 100;

/**
 * A modal panel anchored to an edge of the screen. A native `<dialog>` inside
 * opened with `showModal()` gives the top layer, the inert page, the focus
 * trap and Escape; focus returns to the element that had it before opening.
 *
 * The default `side="bottom"` is an iOS-style sheet with a grabber. It can be
 * dragged down to dismiss, and with `detents` dragged between a medium height
 * (half the screen) and a large one (nearly all of it). The grabber is a real
 * button, so the same changes are available without a pointer: Enter or Space
 * grows the sheet to its next detent and, at the largest, closes it; the Up and
 * Down arrow keys step between detents, and Down at the smallest closes it.
 * Its label says which. `start` and `end` are logical edges (mirrored in a
 * right-to-left page) for a side panel such as an inspector; they have no
 * grabber and are not dragged. There is no `top` side: Apple's guidelines show
 * sheets rising from the bottom and panels at the sides.
 *
 * The accessible name is the slotted title, or `label` when there is none, and
 * the `description` slot describes it. An element inside with
 * `data-close="value"` closes the drawer with that return value. Entering and
 * leaving slide from the edge; with reduced motion they do not move. The page
 * cannot scroll while a drawer is open. Show one drawer at a time.
 *
 * @attr {boolean} open - The drawer is showing. Setting it opens the drawer modally.
 * @attr {string} side - `bottom` (default), `start` or `end`.
 * @attr {string} detents - Space-separated heights a bottom sheet can rest at: `medium`, `large` or `medium large`. Without it the sheet is as tall as its content, up to the large height.
 * @attr {string} detent - The current detent, one of `detents`; the first when unset or not listed. Reflects dragging and the grabber.
 * @attr {string} label - The accessible name when there is no slotted title.
 * @attr {string} description - The accessible description when nothing is slotted in the `description` slot.
 * @attr {string} expand-label - The grabber's accessible name while it grows the sheet. Defaults to the page language's text (see `setMessages`), in English "Expand".
 * @attr {string} close-label - The grabber's accessible name while it closes the sheet. Defaults to the page language's text (see `setMessages`), in English "Close".
 * @attr {boolean} dismissible - Pressing the backdrop also asks to close.
 * @cssprop --pl-drawer-width - The width of a `start` or `end` panel. Defaults to 320px (80 spacing units) and is capped at the viewport width minus 10 spacing units.
 * @slot title - The heading.
 * @slot description - A short explanation under the title.
 * @slot - The scrolling body.
 * @slot footer - `pl-button` elements, in the order they are shown.
 * @csspart dialog - The native dialog.
 * @csspart surface - The panel inside it.
 * @csspart handle - The grabber and header, where a bottom sheet is dragged.
 * @csspart grabber - The grabber button.
 * @csspart bar - The visible bar in the grabber.
 * @csspart header - The title and description.
 * @csspart body - The scrolling content.
 * @csspart footer - The row of actions.
 * @fires pl-open - The drawer opened.
 * @fires pl-cancel - Escape, the backdrop of a dismissible drawer, a drag or the grabber asked to close. Cancelable: `preventDefault()` keeps the drawer open.
 * @fires {CustomEvent<{ returnValue: string }>} pl-close - The drawer closed. `detail.returnValue` holds the value it closed with.
 * @fires {CustomEvent<{ detent: string }>} pl-resize - A drag, the grabber or a key moved a bottom sheet to another detent.
 */
export class PlDrawer extends LitElement {
  static override styles = drawerStyles;
  static override properties = {
    open: { type: Boolean, reflect: true },
    side: { reflect: true },
    detents: { reflect: true },
    detent: { reflect: true },
    label: {},
    description: {},
    expandLabel: { attribute: "expand-label" },
    closeLabel: { attribute: "close-label" },
    dismissible: { type: Boolean, reflect: true },
    _scrolls: { state: true },
  };

  declare open: boolean;
  declare side: PlDrawerSide;
  declare detents: string;
  declare detent: Detent | "";
  declare label: string;
  declare description: string;
  declare expandLabel: string;
  declare closeLabel: string;
  declare dismissible: boolean;
  declare _scrolls: boolean;

  #returnValue = "";
  #locked = false;
  #pressedBackdrop = false;
  #swallowClick = false;
  #drag: {
    id: number;
    y0: number;
    y: number;
    t: number;
    v: number;
    moved: boolean;
  } | null = null;
  readonly #resize = new ResizeObserver(() => this.#measure());

  constructor() {
    super();
    new LensController(this, () =>
      this.renderRoot.querySelector<HTMLElement>("dialog"),
    );
    this.open = false;
    this.side = "bottom";
    this.detents = "";
    this.detent = "";
    this.label = "";
    this.description = "";
    this.expandLabel = "";
    this.closeLabel = "";
    this.dismissible = false;
    this._scrolls = false;
    this.addEventListener("click", this.#onActivate);
  }

  get returnValue(): string {
    return this.#returnValue;
  }

  get #dialog() {
    return this.shadowRoot?.querySelector("dialog");
  }

  get #body(): HTMLElement {
    return this.shadowRoot!.querySelector("[part=body]")!;
  }

  // Only a bottom sheet has detents.
  get #allowed(): Detent[] {
    return this.side === "bottom" ? parseDetents(this.detents) : [];
  }

  /** Opens the drawer modally. */
  show() {
    this.open = true;
  }

  /** Closes the drawer. `returnValue` is reported by `pl-close`. */
  close(returnValue = "") {
    this.#dialog?.close(returnValue);
    this.open = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Removal takes the native dialog out of the top layer but leaves it open.
    if (this.hasUpdated && this.open) {
      this.#dialog!.close();
      this.requestUpdate();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#unlock();
  }

  #unlock() {
    if (this.#locked) unlockScroll();
    this.#locked = false;
  }

  // An attribute removed from outside sets its property to null.
  protected override willUpdate() {
    if (!["bottom", "start", "end"].includes(this.side)) this.side = "bottom";
    const allowed = this.#allowed;
    const next = allowed.includes(this.detent as Detent)
      ? this.detent
      : (allowed[0] ?? "");
    if (this.detent !== next) this.detent = next;
  }

  protected override firstUpdated() {
    this.#resize.observe(this.#body);
  }

  protected override updated() {
    const dialog = this.#dialog!;
    if (this.open && !dialog.open) {
      dialog.returnValue = "";
      dialog.style.removeProperty("--_drag");
      dialog.showModal();
      if (!this.#locked) lockScroll();
      this.#locked = true;
      this.#measure();
      this.#emit("pl-open");
      void this.#focusInitial();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  // A scroll region must be reachable by keyboard.
  #measure() {
    const body = this.#body;
    // Engines round the two heights differently; a pixel is not a scroll.
    this._scrolls = body.scrollHeight - body.clientHeight > 1;
  }

  // The dialog moves focus to its first focusable element, the grabber of a
  // bottom sheet; an author's `autofocus` element comes first.
  async #focusInitial() {
    const target = this.querySelector<HTMLElement>("[autofocus]");
    // A pl-button gets its tabindex when it first updates.
    await (target as Partial<LitElement> | null)?.updateComplete;
    target?.focus();
  }

  #emit(name: string, detail?: object, cancelable = false) {
    return this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        cancelable,
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Asks to close, which a `pl-cancel` handler can refuse.
  #requestClose() {
    if (this.#emit("pl-cancel", undefined, true)) this.close();
  }

  #setDetent(detent: Detent) {
    if (detent === this.detent) return;
    this.detent = detent;
    this.#emit("pl-resize", { detent });
  }

  #onCancel = (event: Event) => {
    if (!this.#emit("pl-cancel", undefined, event.cancelable))
      event.preventDefault();
  };

  // The one place a close ends, whichever way it started.
  #onClose = () => {
    // Reopened before this event ran: the dialog is open again.
    if (this.#dialog!.open) return;
    this.open = false;
    this.#unlock();
    this.#returnValue = this.#dialog!.returnValue;
    this.#emit("pl-close", { returnValue: this.#returnValue });
  };

  // The panel fills the native dialog, so a press on the dialog itself is a
  // press on the backdrop. It must also start there: a text selection dragged
  // out of the panel ends on the dialog too.
  #onPointerdown = (event: Event) => {
    this.#pressedBackdrop = event.target === this.#dialog;
  };

  #onBackdropClick = (event: Event) => {
    if (
      event.target === this.#dialog &&
      this.#pressedBackdrop &&
      this.dismissible
    )
      this.#requestClose();
  };

  #onActivate = (event: Event) => {
    const closer = (event.target as Element).closest?.("[data-close]");
    // The nearest dialog or drawer owns the closer, so one inside a nested
    // dialog does not close this drawer too.
    if (
      closer?.closest("pl-drawer, pl-dialog") === this &&
      !closer.matches(":disabled")
    )
      this.close(closer.getAttribute("data-close") ?? "");
  };

  // Tap or Enter: grow to the next detent, and close from the largest.
  #onGrabberClick = () => {
    const next = stepDetent(this.#allowed, this.detent as Detent, 1);
    if (next) this.#setDetent(next);
    else this.#requestClose();
  };

  #onGrabberKeydown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const up = event.key === "ArrowUp";
    const next = stepDetent(this.#allowed, this.detent as Detent, up ? 1 : -1);
    if (next) this.#setDetent(next);
    else if (!up) this.#requestClose();
  };

  #onHandleDown = (event: PointerEvent) => {
    if (
      this.side !== "bottom" ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    this.#drag = {
      id: event.pointerId,
      y0: event.clientY,
      y: event.clientY,
      t: event.timeStamp,
      v: 0,
      moved: false,
    };
  };

  #onHandleMove = (event: PointerEvent) => {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.id) return;
    const dy = event.clientY - drag.y0;
    if (!drag.moved) {
      if (Math.abs(dy) < slop) return;
      drag.moved = true;
      // Only a drag is captured, so a tap still clicks the grabber.
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.#dialog!.toggleAttribute("data-dragging", true);
    }
    drag.v = (event.clientY - drag.y) / Math.max(event.timeStamp - drag.t, 1);
    drag.y = event.clientY;
    drag.t = event.timeStamp;
    // Pulling up past the top meets resistance.
    this.#dialog!.style.setProperty("--_drag", `${dy > 0 ? dy : dy / 4}px`);
  };

  #onHandleEnd = (event: PointerEvent) => {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.id) return;
    this.#drag = null;
    if (!drag.moved) return;
    const dialog = this.#dialog!;
    dialog.removeAttribute("data-dragging");
    dialog.style.removeProperty("--_drag");
    // The click that ends a drag is not a tap on the grabber.
    this.#swallowClick = true;
    setTimeout(() => (this.#swallowClick = false));
    if (event.type === "pointercancel") return;
    const result = settle({
      dy: event.clientY - drag.y0,
      velocity: event.timeStamp - drag.t > flickWindow ? 0 : drag.v,
      height: dialog.getBoundingClientRect().height,
      detent: this.detent as Detent,
      detents: this.#allowed,
    });
    if (result === "close") this.#requestClose();
    else if (result !== "stay") this.#setDetent(result);
  };

  #onHandleClick = {
    capture: true,
    handleEvent: (event: Event) => {
      if (!this.#swallowClick) return;
      event.stopPropagation();
      event.preventDefault();
    },
  };

  override render() {
    const bottom = this.side === "bottom";
    const title = this.querySelector(
      ":scope > [slot=title]",
    )?.textContent?.trim();
    const described =
      !!this.description && !this.querySelector(":scope > [slot=description]");
    const expands = !!stepDetent(this.#allowed, this.detent as Detent, 1);
    return html`<dialog
      part="dialog"
      aria-label=${title || this.label || nothing}
      aria-describedby=${described ? "summary" : "description"}
      data-detent=${this.detent || nothing}
      @cancel=${this.#onCancel}
      @close=${this.#onClose}
      @pointerdown=${this.#onPointerdown}
      @click=${this.#onBackdropClick}
    >
      <div part="surface">
        <div
          part="handle"
          @pointerdown=${this.#onHandleDown}
          @pointermove=${this.#onHandleMove}
          @pointerup=${this.#onHandleEnd}
          @pointercancel=${this.#onHandleEnd}
          @click=${this.#onHandleClick}
        >
          ${
            bottom
              ? html`<button
                  part="grabber"
                  type="button"
                  aria-label=${
                    (expands ? this.expandLabel : this.closeLabel) ||
                    messages(this)[expands ? "expand" : "close"]
                  }
                  @click=${this.#onGrabberClick}
                  @keydown=${this.#onGrabberKeydown}
                >
                  <span part="bar" aria-hidden="true"></span>
                </button>`
              : nothing
          }
          <div part="header">
            <div id="title" part="title" hidden>
              <slot
                name="title"
                @slotchange=${(event: Event) => {
                  hideWhenEmpty(event);
                  this.requestUpdate();
                }}
              ></slot>
            </div>
            <div id="description" part="description" hidden>
              <slot
                name="description"
                @slotchange=${(event: Event) => {
                  hideWhenEmpty(event);
                  this.requestUpdate();
                }}
              ></slot>
            </div>
            ${described ? html`<span id="summary" hidden>${this.description}</span>` : nothing}
          </div>
        </div>
        <div part="body" tabindex=${this._scrolls ? 0 : nothing}>
          <slot @slotchange=${() => this.#measure()}></slot>
        </div>
        <div part="footer" hidden>
          <slot name="footer" @slotchange=${hideWhenEmpty}></slot>
        </div>
      </div>
    </dialog>`;
  }
}

customElements.define("pl-drawer", PlDrawer);

declare global {
  interface HTMLElementTagNameMap {
    "pl-drawer": PlDrawer;
  }
}
