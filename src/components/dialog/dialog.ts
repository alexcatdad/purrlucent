import { LitElement, html, nothing } from "lit";
import { dialogStyles } from "./dialog.css.ts";

// Dialogs can stack, so the lock is released with the last one.
let locks = 0;
let savedOverflow = "";

const lockScroll = () => {
  if (locks++ === 0) {
    savedOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
  }
};

const unlockScroll = () => {
  if (--locks === 0) document.documentElement.style.overflow = savedOverflow;
};

/**
 * A modal dialog. A native `<dialog>` inside opened with `showModal()` gives
 * the top layer, the inert page, the focus trap and Escape. The `alert`
 * variant is a compact, urgent question with an `alertdialog` role; the
 * `sheet` variant is a larger panel with a title area, a scrolling body and a
 * row of actions. The accessible name is the slotted title, or `label` when
 * there is none. The description is the default slot of an alert and the
 * `description` slot of a sheet, so a sheet's form is not read out as a
 * description.
 *
 * Initial focus goes to the element with `autofocus`, otherwise the first
 * action; focus returns to the element that had it before opening. An element
 * inside with `data-close="value"` closes the dialog with that return value.
 * The page cannot scroll while a dialog is open.
 *
 * @attr {boolean} open - The dialog is showing. Setting it opens the dialog modally.
 * @attr {string} variant - `sheet` (default) or `alert`.
 * @attr {string} label - The accessible name when there is no slotted title.
 * @attr {boolean} dismissible - A sheet also closes when the backdrop is pressed. An alert never does.
 * @slot icon - An `svg` shown as a tile.
 * @slot title - The heading.
 * @slot description - A short explanation under the sheet's title.
 * @slot - The alert's message, or the sheet's scrolling body.
 * @slot actions - `purr-button` elements, in the order they are shown.
 * @csspart dialog - The native dialog.
 * @csspart surface - The padded panel inside it.
 * @csspart header - The icon and title.
 * @csspart body - The scrolling content.
 * @csspart actions - The row or column of actions.
 * @fires purr-cancel - Escape, or the backdrop of a dismissible sheet, asked to close. Cancelable: `preventDefault()` keeps the dialog open.
 * @fires purr-close - The dialog closed. `detail.returnValue` holds the value it closed with.
 */
export class PurrDialog extends LitElement {
  static override styles = dialogStyles;
  static override properties = {
    open: { type: Boolean, reflect: true },
    variant: { reflect: true },
    label: {},
    dismissible: { type: Boolean, reflect: true },
    _scrolls: { state: true },
    _actions: { state: true },
  };

  declare open: boolean;
  declare variant: "alert" | "sheet";
  declare label: string;
  declare dismissible: boolean;
  declare _scrolls: boolean;
  declare _actions: number;

  #returnValue = "";
  #locked = false;
  #pressedBackdrop = false;
  readonly #resize = new ResizeObserver(() => this.#measure());

  constructor() {
    super();
    this.open = false;
    this.variant = "sheet";
    this.label = "";
    this.dismissible = false;
    this._scrolls = false;
    this._actions = 0;
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

  /** Opens the dialog modally. */
  show() {
    this.open = true;
  }

  /** Closes the dialog. `returnValue` is reported by `purr-close`. */
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

  protected override firstUpdated() {
    this.#resize.observe(this.#body);
  }

  protected override updated() {
    const dialog = this.#dialog!;
    if (this.open && !dialog.open) {
      dialog.returnValue = "";
      dialog.showModal();
      if (!this.#locked) lockScroll();
      this.#locked = true;
      void this.#focusInitial();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  // A scroll region must be reachable by keyboard.
  #measure() {
    const body = this.#body;
    this._scrolls = body.scrollHeight > body.clientHeight;
  }

  async #focusInitial() {
    const target =
      this.querySelector<HTMLElement>("[autofocus]") ??
      this.shadowRoot!.querySelector<HTMLSlotElement>(
        "slot[name=actions]",
      )!.assignedElements()[0];
    // A purr-button gets its tabindex when it first updates.
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
    if (!this.#emit("purr-cancel", undefined, event.cancelable))
      event.preventDefault();
  };

  // The one place a close ends, whichever way it started.
  #onClose = () => {
    // Reopened before this event ran: the dialog is open again.
    if (this.#dialog!.open) return;
    this.open = false;
    this.#unlock();
    this.#returnValue = this.#dialog!.returnValue;
    this.#emit("purr-close", { returnValue: this.#returnValue });
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
      this.#emit("purr-cancel", undefined, true)
    )
      this.close();
  };

  #onActivate = (event: Event) => {
    const closer = (event.target as Element).closest?.("[data-close]");
    if (closer?.closest("purr-dialog") === this && !closer.matches(":disabled"))
      this.close(closer.getAttribute("data-close") ?? "");
  };

  override render() {
    const alert = this.variant === "alert";
    const titled = !!this.querySelector(":scope > [slot=title]");
    return html`<dialog
      part="dialog"
      role=${alert ? "alertdialog" : nothing}
      aria-labelledby=${titled ? "title" : nothing}
      aria-label=${!titled && this.label ? this.label : nothing}
      aria-describedby="description"
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
                : html`<div id="description" part="description">
                    <slot name="description"></slot>
                  </div>`
            }
          </div>
        </div>
        <div
          part="body"
          id=${alert ? "description" : nothing}
          tabindex=${this._scrolls ? 0 : nothing}
        >
          <slot @slotchange=${() => this.#measure()}></slot>
        </div>
        <div part="actions" ?data-stacked=${alert && this._actions !== 2}>
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

customElements.define("purr-dialog", PurrDialog);

declare global {
  interface HTMLElementTagNameMap {
    "purr-dialog": PurrDialog;
  }
}
