import { LitElement, html, nothing } from "lit";
import { closeGlyph } from "../../behaviors/glyphs.ts";
import { messages } from "../../behaviors/locale.ts";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { dialogStyles } from "./dialog.css.ts";

// Dialogs can stack, so the lock is released with the last one.
let locks = 0;
let savedOverflow = "";
let savedGutter = "";

// A second sheet over an open one is warned about; an alert over a sheet is not.
const openSheets = new Set<PlDialog>();

// A page with a classic scrollbar keeps its room while the lock hides it, so
// the page does not shift sideways; a page without one gains no gutter.
const lockScroll = () => {
  if (locks++ === 0) {
    const root = document.documentElement;
    savedOverflow = root.style.overflow;
    savedGutter = root.style.scrollbarGutter;
    if (window.innerWidth - root.clientWidth > 0)
      root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
  }
};

const unlockScroll = () => {
  if (--locks === 0) {
    const root = document.documentElement;
    root.style.overflow = savedOverflow;
    root.style.scrollbarGutter = savedGutter;
  }
};

type CloseReason = "user" | "programmatic";

/**
 * A modal dialog. A native `<dialog>` inside opened with `showModal()` gives
 * the top layer, the inert page, the focus trap and Escape. The `alert`
 * variant is a compact, urgent question with an `alertdialog` role; the
 * `sheet` variant is a larger panel with a title area, a scrolling body and a
 * row of actions. The accessible name is the slotted title, or `label` when
 * there is none. The description is the default slot of an alert and the
 * `description` slot of a sheet, so a sheet's form is not read out as a
 * description; the `description` attribute gives one when nothing is slotted.
 *
 * Initial focus goes to the element with `autofocus`, otherwise the default
 * action (a `pl-button` with `default`, unless destructive), the cancel
 * action (`cancel`) or the first action. Return clicks the default action,
 * except in a multi-line text field or on a focused button; Escape and
 * Command-Period click the cancel action, and without one Escape closes the
 * dialog. A destructive default is ignored and warned about. An alert with
 * more than three actions is warned about and still shows them all. A sheet
 * opened while another sheet is open is warned about and still shows; an alert
 * over a sheet is not. Focus returns
 * to the element that had it before opening. An element
 * inside with `data-close="value"` closes the dialog with that return value.
 * The page cannot scroll while a dialog is open.
 *
 * With `nonmodal` the dialog opens without blocking the page: the rest of the
 * page stays interactive, and there is no scrim, focus trap or scroll lock.
 * Use it for a panel that works beside the page, such as an in-context
 * translation tool, and not for a question that must be answered first.
 * Escape and the close button close it while focus is inside it.
 *
 * @attr {boolean} open - The dialog is showing. Setting it opens the dialog modally, or without blocking the page with `nonmodal`.
 * @attr {string} variant - `sheet` (default) or `alert`.
 * @attr {string} label - The accessible name when there is no slotted title.
 * @attr {string} description - The accessible description when nothing is slotted for it: the `description` slot of a sheet, the default slot of an alert.
 * @attr {boolean} dismissible - A sheet also closes when the backdrop is pressed. An alert never does.
 * @attr {boolean} closable - A sheet shows a close button in its header. It asks to close like Escape.
 * @attr {string} close-label - The close button's accessible name. Defaults to the page language's text (see `setMessages`), in English "Close".
 * @attr {boolean} nonmodal - Opens without blocking the page: no scrim, inert page or scroll lock. Set it before opening.
 * @cssprop --pl-dialog-width - The width of a sheet. Defaults to 390px (97.5 spacing units) and is capped at the viewport width minus the page margin. An alert ignores it.
 * @slot icon - An `svg` shown as a tile.
 * @slot title - The heading.
 * @slot description - A short explanation under the sheet's title.
 * @slot - The alert's message, or the sheet's scrolling body.
 * @slot actions - `pl-button` elements, in the order they are shown.
 * @slot actions-start - Non-button content, such as a status line, at the start of a sheet's row of actions.
 * @csspart dialog - The native dialog.
 * @csspart surface - The padded panel inside it.
 * @csspart header - The icon and title.
 * @csspart close - The close button of a closable sheet.
 * @csspart body - The scrolling content.
 * @csspart actions - The row or column of actions.
 * @fires pl-cancel - Escape, the close button, or the backdrop of a dismissible sheet, asked to close. Cancelable: `preventDefault()` keeps the dialog open.
 * @fires {CustomEvent<{ returnValue: string, reason: "user" | "programmatic" }>} pl-close - The dialog closed. `detail.returnValue` holds the value it closed with. `detail.reason` is `user` for Escape, an action, the backdrop or the close button, and `programmatic` for `close()` or `open` set to false. It does not fire when `open` is set again before the close completes.
 */
export class PlDialog extends LitElement {
  static override styles = dialogStyles;
  static override properties = {
    open: { type: Boolean, reflect: true },
    variant: { reflect: true },
    label: {},
    description: {},
    dismissible: { type: Boolean, reflect: true },
    closable: { type: Boolean, reflect: true },
    closeLabel: { attribute: "close-label" },
    nonmodal: { type: Boolean, reflect: true },
    _scrolls: { state: true },
    _actions: { state: true },
  };

  declare open: boolean;
  declare variant: "alert" | "sheet";
  declare label: string;
  declare description: string;
  declare dismissible: boolean;
  declare closable: boolean;
  declare closeLabel: string;
  declare nonmodal: boolean;
  declare _scrolls: boolean;
  declare _actions: number;

  #returnValue = "";
  #locked = false;
  #pressedBackdrop = false;
  #reason: CloseReason = "programmatic";
  #opener: Element | null = null;
  readonly #resize = new ResizeObserver(() => this.#measure());

  constructor() {
    super();
    this.open = false;
    this.variant = "sheet";
    this.label = "";
    this.description = "";
    this.dismissible = false;
    this.closable = false;
    this.closeLabel = "";
    this.nonmodal = false;
    this._scrolls = false;
    this._actions = 0;
    this.addEventListener("click", this.#onActivate);
    this.addEventListener("keydown", this.#onKeydown);
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

  /** Opens the dialog modally, or without blocking the page with `nonmodal`. */
  show() {
    this.open = true;
  }

  /** Closes the dialog. `returnValue` is reported by `pl-close`. */
  close(returnValue = "") {
    this.#finish(returnValue, "programmatic");
  }

  #finish(returnValue: string, reason: CloseReason) {
    this.#reason = reason;
    this.#dialog?.close(returnValue);
    this.open = false;
    openSheets.delete(this);
  }

  // Asks to close, which a `pl-cancel` handler can refuse.
  #requestClose() {
    if (this.#emit("pl-cancel", undefined, true)) this.#finish("", "user");
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
    openSheets.delete(this);
  }

  protected override firstUpdated() {
    this.#resize.observe(this.#body);
  }

  protected override updated() {
    const dialog = this.#dialog!;
    if (this.open && !dialog.open) {
      dialog.returnValue = "";
      if (this.nonmodal) {
        this.#opener = document.activeElement;
        dialog.show();
      } else {
        dialog.showModal();
        if (!this.#locked) lockScroll();
        this.#locked = true;
      }
      // Now, not on the next resize callback: the body has its size already.
      this.#measure();
      void this.#focusInitial();
    } else if (!this.open && dialog.open) {
      openSheets.delete(this);
      this.#reason = "programmatic";
      dialog.close();
    }
  }

  // A scroll region must be reachable by keyboard.
  #measure() {
    const body = this.#body;
    // Engines round the two heights differently; a pixel is not a scroll.
    this._scrolls = body.scrollHeight - body.clientHeight > 1;
  }

  // The action marked `default` or `cancel`. A destructive default is unsafe
  // to trigger by habit, so it is not one.
  #action(role: "default" | "cancel") {
    const button = this.querySelector<HTMLElement>(
      `:scope > [slot=actions][${role}]`,
    );
    return role === "default" && button?.hasAttribute("destructive")
      ? null
      : button;
  }

  async #focusInitial() {
    if (this.querySelector(":scope > [slot=actions][default][destructive]"))
      console.warn("pl-dialog: a destructive button cannot be the default.");
    if (
      this.variant === "alert" &&
      this.querySelectorAll(":scope > [slot=actions]").length > 3
    )
      console.warn("pl-dialog: an alert takes at most three buttons.");
    if (this.variant === "sheet" && !this.nonmodal) {
      if (openSheets.size)
        console.warn(
          "pl-dialog: show one sheet at a time; close the open sheet first.",
        );
      openSheets.add(this);
    }
    const target =
      this.querySelector<HTMLElement>("[autofocus]") ??
      this.#action("default") ??
      this.#action("cancel") ??
      this.shadowRoot!.querySelector<HTMLSlotElement>(
        "slot[name=actions]",
      )!.assignedElements()[0];
    // A pl-button gets its tabindex when it first updates.
    await (target as Partial<LitElement> | undefined)?.updateComplete;
    (target as HTMLElement | undefined)?.focus();
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

  #onCancel = (event: Event) => {
    if (!this.#emit("pl-cancel", undefined, event.cancelable))
      event.preventDefault();
    else this.#reason = "user";
  };

  // The one place a close ends, whichever way it started.
  #onClose = () => {
    // Reopened before this event ran: the dialog is open again.
    if (this.#dialog!.open) return;
    this.open = false;
    this.#unlock();
    this.#returnValue = this.#dialog!.returnValue;
    const reason = this.#reason;
    this.#reason = "programmatic";
    // The native dialog restores focus only when it is modal.
    if (this.nonmodal) (this.#opener as HTMLElement | null)?.focus?.();
    this.#opener = null;
    this.#emit("pl-close", { returnValue: this.#returnValue, reason });
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
      this.variant === "sheet" &&
      this.dismissible &&
      !this.nonmodal
    )
      this.#requestClose();
  };

  #onActivate = (event: Event) => {
    const closer = (event.target as Element).closest?.("[data-close]");
    // The nearest dialog or drawer owns the closer.
    if (
      closer?.closest("pl-drawer, pl-dialog") === this &&
      !closer.matches(":disabled")
    )
      this.#finish(closer.getAttribute("data-close") ?? "", "user");
  };

  // Return clicks the default button, Escape and Command-Period the cancel
  // button. A focused button, a multi-line field and an IME keep their Enter.
  #onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing) return;
    let button: HTMLElement | null | undefined;
    const cancels =
      event.key === "Escape" || (event.metaKey && event.key === ".");
    if (event.key === "Enter")
      button = event
        .composedPath()
        .some(
          (el) =>
            el instanceof Element &&
            el.matches(
              "textarea, [contenteditable]:not([contenteditable=false]), pl-button",
            ),
        )
        ? null
        : this.#action("default");
    else if (cancels) button = this.#action("cancel");
    if (!button) {
      // A nonmodal dialog has no native Escape.
      if (cancels && this.nonmodal && this.open) {
        event.preventDefault();
        this.#requestClose();
      }
      return;
    }
    event.preventDefault();
    if (!button.matches(":disabled")) button.click();
  };

  // A description slotted for the sheet, or a message in the alert's body.
  get #hasDescription() {
    return this.variant === "alert"
      ? [...this.childNodes].some((node) =>
          node instanceof Element
            ? !node.hasAttribute("slot")
            : !!node.textContent?.trim(),
        )
      : !!this.querySelector(":scope > [slot=description]");
  }

  override render() {
    const alert = this.variant === "alert";
    const titled = !!this.querySelector(":scope > [slot=title]");
    const described = !this.#hasDescription && !!this.description;
    return html`<dialog
      part="dialog"
      role=${alert ? "alertdialog" : nothing}
      aria-labelledby=${titled ? "title" : nothing}
      aria-label=${!titled && this.label ? this.label : nothing}
      aria-describedby=${described ? "summary" : "description"}
      @cancel=${this.#onCancel}
      @close=${this.#onClose}
      @pointerdown=${this.#onPointerdown}
      @click=${this.#onBackdropClick}
    >
      <div part="surface">
        <div part="header">
          <slot name="icon"></slot>
          <div part="text">
            <div id="title" part="title">
              <slot
                name="title"
                @slotchange=${() => this.requestUpdate()}
              ></slot>
            </div>
            ${
              alert
                ? nothing
                : html`<div id="description" part="description" hidden>
                    <slot
                      name="description"
                      @slotchange=${(event: Event) => {
                        hideWhenEmpty(event);
                        this.requestUpdate();
                      }}
                    ></slot>
                  </div>`
            }
          </div>
          ${
            this.closable && !alert
              ? html`<button
                  part="close"
                  type="button"
                  aria-label=${this.closeLabel || messages(this).close}
                  @click=${() => this.#requestClose()}
                >
                  ${closeGlyph}
                </button>`
              : nothing
          }
        </div>
        <div
          part="body"
          id=${alert ? "description" : nothing}
          tabindex=${this._scrolls ? 0 : nothing}
        >
          <slot
            @slotchange=${() => {
              this.#measure();
              this.requestUpdate();
            }}
          ></slot>
        </div>
        ${described ? html`<span id="summary" hidden>${this.description}</span>` : nothing}
        <div part="actions" ?data-stacked=${alert && this._actions !== 2}>
          ${alert ? nothing : html`<slot name="actions-start"></slot>`}
          <slot
            name="actions"
            @slotchange=${(event: Event) =>
              (this._actions = (
                event.target as HTMLSlotElement
              ).assignedElements().length)}
          ></slot>
        </div>
      </div>
    </dialog>`;
  }
}

customElements.define("pl-dialog", PlDialog);

declare global {
  interface HTMLElementTagNameMap {
    "pl-dialog": PlDialog;
  }
}
