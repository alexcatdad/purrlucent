import { LitElement, html, nothing } from "lit";
import { closeGlyph, errorGlyph } from "../../behaviors/glyphs.ts";
import { hideWhenEmpty } from "../../behaviors/slot-presence.ts";
import { panelSurface } from "../../surfaces/surfaces.css.ts";
import "../button/button.ts";
import { toastStyles, toasterStyles } from "./toast.css.ts";

export type PlToastVariant = "neutral" | "destructive";
export type PlToastCloseReason = "close" | "escape" | "timeout" | "action";

/** What `PlToaster.show()` builds a toast from. */
export interface PlToastOptions {
  /** What happened, in a few words. */
  title: string;
  /** One short sentence of detail. */
  description?: string;
  variant?: PlToastVariant;
  /** A button under the text. A toast with an action never dismisses itself, and pressing the action closes it after `onClick` runs. */
  action?: { label: string; onClick?: () => void };
  /** Milliseconds before the toast dismisses itself; 0 keeps it. Ignored when there is an action. Defaults to 6000. */
  duration?: number;
}

/**
 * A non-blocking status message: a title, an optional description, an
 * optional action and a close button. It never takes focus when it appears.
 * Inside a `pl-toaster` the toaster's live region announces it, and a
 * destructive toast is a `role="alert"` of its own; outside one it is a
 * `status` (or `alert`) itself.
 *
 * A toast without an action dismisses itself after `duration` milliseconds.
 * The countdown pauses while the pointer is over the toast or focus is inside
 * it, and resumes with what is left. It does not depend on any animation, so
 * reduced motion changes nothing about it. A toast with an action stays until
 * it is closed, because the action may be the only way to act on it.
 * Escape closes the toast that has focus and returns focus to where it was.
 * A closed toast stays closed; show a new one.
 *
 * @attr {string} variant - `neutral` (default) or `destructive`.
 * @attr {number} duration - Milliseconds before it dismisses itself. Defaults to 6000. 0 keeps it. Ignored when there is an action.
 * @attr {string} close-label - The close button's accessible name. Defaults to "Dismiss".
 * @slot title - The heading.
 * @slot - The description.
 * @slot action - A `pl-button`. Pressing it closes the toast, unless its click is prevented.
 * @csspart text - The title and description.
 * @csspart close - The close button.
 * @fires {CustomEvent<{ reason: "close" | "escape" | "timeout" | "action" }>} pl-close - The toast closed: the close button, Escape, its time ran out, or its action was pressed.
 */
export class PlToast extends LitElement {
  static override styles = [panelSurface, toastStyles];
  static override properties = {
    variant: { reflect: true },
    duration: { type: Number },
    closeLabel: { attribute: "close-label" },
  };

  declare variant: PlToastVariant;
  declare duration: number;
  declare closeLabel: string;

  #role: string | null = null;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #left = 0;
  #since = 0;
  #hovered = false;
  #focused = false;
  #returnTo: Element | null = null;

  constructor() {
    super();
    this.variant = "neutral";
    this.duration = 6000;
    this.closeLabel = "Dismiss";
    this.addEventListener("pointerenter", () => this.#hover(true));
    this.addEventListener("pointerleave", () => this.#hover(false));
    this.addEventListener("focusin", this.#onFocusin);
    this.addEventListener("focusout", this.#onFocusout);
    this.addEventListener("keydown", this.#onKeydown);
    this.addEventListener("click", this.#onClick);
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) this.#sync();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#sync();
  }

  // A role attribute, so it shows in the DOM and in the accessibility tree of
  // every engine. An author's own role is kept; only our own value is replaced.
  protected override willUpdate(changed: Map<PropertyKey, unknown>) {
    if (changed.has("duration")) {
      // Removing the attribute sets the property to null; fall back to the default.
      this.duration ??= 6000;
      this.#pause(false);
      this.#left = this.duration;
    }
    if (this.hasAttribute("role") && this.getAttribute("role") !== this.#role) {
      return;
    }
    this.#role =
      this.variant === "destructive"
        ? "alert"
        : this.closest("pl-toaster")
          ? null
          : "status";
    if (this.#role) this.setAttribute("role", this.#role);
    else this.removeAttribute("role");
  }

  protected override updated() {
    this.#sync();
  }

  /** Closes the toast and fires `pl-close` with the reason. */
  close(reason: PlToastCloseReason = "close") {
    if (this.hidden) return;
    this.#pause(false);
    // Focus inside a toast that goes away would fall to the page's start.
    if (this.matches(":focus-within") && this.#returnTo?.isConnected)
      (this.#returnTo as HTMLElement).focus?.();
    this.hidden = true;
    this.dispatchEvent(
      new CustomEvent("pl-close", {
        detail: { reason },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // The countdown runs while the toast is showing, has no action, and is
  // neither hovered nor focused. Pausing keeps what is left of the time.
  #sync() {
    const run =
      this.isConnected &&
      !this.hidden &&
      this.duration > 0 &&
      !this.querySelector(":scope > [slot=action]") &&
      !this.#hovered &&
      !this.#focused;
    if (run && this.#timer === undefined) {
      this.#since = performance.now();
      this.#timer = setTimeout(() => this.close("timeout"), this.#left);
    } else if (!run) this.#pause(true);
  }

  #pause(keepRemainder: boolean) {
    if (this.#timer === undefined) return;
    clearTimeout(this.#timer);
    this.#timer = undefined;
    if (keepRemainder) this.#left -= performance.now() - this.#since;
  }

  #hover(on: boolean) {
    this.#hovered = on;
    this.#sync();
  }

  #onFocusin = (event: FocusEvent) => {
    if (!this.#focused) this.#returnTo = event.relatedTarget as Element | null;
    this.#focused = true;
    this.#sync();
  };

  // Retargeted to the host, so moving inside the toast still counts as inside.
  #onFocusout = (event: FocusEvent) => {
    this.#focused = this.contains(event.relatedTarget as Node | null);
    this.#sync();
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    this.close("escape");
  };

  #onClick = (event: Event) => {
    if (event.defaultPrevented) return;
    const action = (event.target as Element).closest?.("[slot=action]");
    if (action?.closest("pl-toast") === this) this.close("action");
  };

  override render() {
    return html`${
        this.variant === "destructive"
          ? html`<span part="icon">${errorGlyph}</span>`
          : nothing
      }
      <div part="text">
        <div part="title"><slot name="title"></slot></div>
        <div part="description"><slot></slot></div>
      </div>
      <button
        part="close"
        type="button"
        aria-label=${this.closeLabel || "Dismiss"}
        @click=${() => this.close("close")}
      >
        ${closeGlyph}
      </button>
      <div part="actions" hidden>
        <slot
          name="action"
          @slotchange=${(event: Event) => {
            hideWhenEmpty(event);
            this.#sync();
          }}
        ></slot>
      </div>`;
  }
}

customElements.define("pl-toast", PlToast);

// The toasts `show()` made are removed when they close; the author's own are not.
const made = new WeakSet<Element>();

function createToast(options: PlToastOptions): PlToast {
  const toast = document.createElement("pl-toast");
  toast.variant = options.variant ?? "neutral";
  if (options.duration !== undefined) toast.duration = options.duration;
  const title = document.createElement("strong");
  title.slot = "title";
  title.textContent = options.title;
  toast.append(title);
  if (options.description) toast.append(options.description);
  if (options.action) {
    const { label, onClick } = options.action;
    const button = document.createElement("pl-button");
    button.slot = "action";
    button.variant = "tinted";
    button.textContent = label;
    button.addEventListener("click", () => onClick?.());
    toast.append(button);
  }
  made.add(toast);
  return toast;
}

/**
 * The region toasts appear in: a stack at the inline-end bottom edge of the
 * viewport (the left under right-to-left), in the top layer, newest last.
 * Place one per page, early, and leave it in the document: a live region
 * announces what is added to it, so it must exist before the first toast.
 * It is a polite `status` that announces each addition on its own.
 *
 * Show a toast from script. `toaster.show()` adds one to that toaster;
 * `PlToaster.show()` uses the page's first `pl-toaster`, and makes one when
 * there is none (that first toast then waits a moment so it is announced).
 * Both return the `pl-toast`, which is removed when it closes.
 *
 * ```js
 * PlToaster.show({
 *   title: "Message deleted",
 *   description: "It is gone from every device.",
 *   action: { label: "Undo", onClick: () => restore() },
 * });
 * PlToaster.show({ title: "Not saved", variant: "destructive" });
 * ```
 *
 * Or write `pl-toast` elements inside it.
 *
 * @slot - The toasts.
 * @fires {CustomEvent<{ reason: "close" | "escape" | "timeout" | "action" }>} pl-close - A toast in it closed. Bubbles from the toast.
 */
export class PlToaster extends LitElement {
  static override styles = toasterStyles;

  constructor() {
    super();
    this.addEventListener("pl-close", (event) => {
      const toast = event.target as Element;
      if (made.has(toast)) toast.remove();
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    // Atomic is the status role's default; it would read the whole stack again.
    if (!this.hasAttribute("role")) this.setAttribute("role", "status");
    this.setAttribute("aria-atomic", "false");
    this.popover = "manual";
    if (this.hasUpdated) this.#top();
  }

  protected override firstUpdated() {
    this.#top();
  }

  #top() {
    if (!this.matches(":popover-open")) this.showPopover();
  }

  /** Adds a toast to this toaster and returns it. */
  show(options: PlToastOptions): PlToast {
    const toast = createToast(options);
    this.append(toast);
    return toast;
  }

  /** Adds a toast to the page's first toaster, making one when there is none. */
  static show(options: PlToastOptions): PlToast {
    const existing = document.querySelector("pl-toaster");
    if (existing) return existing.show(options);
    const toaster = document.createElement("pl-toaster");
    document.body.append(toaster);
    const toast = createToast(options);
    setTimeout(() => toaster.append(toast), 100);
    return toast;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("pl-toaster", PlToaster);

declare global {
  interface HTMLElementTagNameMap {
    "pl-toast": PlToast;
    "pl-toaster": PlToaster;
  }
}
