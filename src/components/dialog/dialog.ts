import { LitElement, html, nothing } from "lit";
import { dialogStyles } from "./dialog.css.ts";

// Dialogs can stack, so the lock is released with the last one.
let locks = 0;
let savedOverflow = "";

// A second sheet over an open one is warned about; an alert over a sheet is not.
const openSheets = new Set<PlDialog>();

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
 * @attr {boolean} open - The dialog is showing. Setting it opens the dialog modally.
 * @attr {string} variant - `sheet` (default) or `alert`.
 * @attr {string} label - The accessible name when there is no slotted title.
 * @attr {boolean} dismissible - A sheet also closes when the backdrop is pressed. An alert never does.
 * @cssprop --pl-dialog-width - The width of a sheet. Defaults to 390px (97.5 spacing units) and is capped at the viewport width minus the page margin. An alert ignores it.
 * @slot icon - An `svg` shown as a tile.
 * @slot title - The heading.
 * @slot description - A short explanation under the sheet's title.
 * @slot - The alert's message, or the sheet's scrolling body.
 * @slot actions - `pl-button` elements, in the order they are shown.
 * @csspart dialog - The native dialog.
 * @csspart surface - The padded panel inside it.
 * @csspart header - The icon and title.
 * @csspart body - The scrolling content.
 * @csspart actions - The row or column of actions.
 * @fires pl-cancel - Escape, or the backdrop of a dismissible sheet, asked to close. Cancelable: `preventDefault()` keeps the dialog open.
 * @fires pl-close - The dialog closed. `detail.returnValue` holds the value it closed with.
 */
export class PlDialog extends LitElement {
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

  /** Opens the dialog modally. */
  show() {
    this.open = true;
  }

  /** Closes the dialog. `returnValue` is reported by `pl-close`. */
  close(returnValue = "") {
    this.#dialog?.close(returnValue);
    this.open = false;
    openSheets.delete(this);
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
      dialog.showModal();
      if (!this.#locked) lockScroll();
      this.#locked = true;
      // Now, not on the next resize callback: the body has its size already.
      this.#measure();
      void this.#focusInitial();
    } else if (!this.open && dialog.open) {
      openSheets.delete(this);
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
    if (this.variant === "sheet") {
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
      this.variant === "sheet" &&
      this.dismissible &&
      this.#emit("pl-cancel", undefined, true)
    )
      this.close();
  };

  #onActivate = (event: Event) => {
    const closer = (event.target as Element).closest?.("[data-close]");
    if (closer?.closest("pl-dialog") === this && !closer.matches(":disabled"))
      this.close(closer.getAttribute("data-close") ?? "");
  };

  // Return clicks the default button, Escape and Command-Period the cancel
  // button. A focused button, a multi-line field and an IME keep their Enter.
  #onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing) return;
    let button: HTMLElement | null | undefined;
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
    else if (event.key === "Escape" || (event.metaKey && event.key === "."))
      button = this.#action("cancel");
    if (!button) return;
    event.preventDefault();
    if (!button.matches(":disabled")) button.click();
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

customElements.define("pl-dialog", PlDialog);

declare global {
  interface HTMLElementTagNameMap {
    "pl-dialog": PlDialog;
  }
}
