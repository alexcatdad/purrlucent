import { LitElement, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { AnchoredController } from "../../behaviors/anchored.ts";
import { DismissController } from "../../behaviors/dismiss.ts";
import type { Placement, Side } from "../../behaviors/position.ts";
import { popoverStyles } from "./popover.css.ts";

/**
 * A non-modal floating panel anchored to a trigger. The trigger is any
 * focusable control in the `trigger` slot; the element sets `aria-haspopup`
 * and `aria-expanded` on it. The panel is a dialog named by `label`: it opens
 * on a press of the trigger, takes focus to its first focusable content (or to
 * itself), and closes on Escape (focus returns to the trigger), on a press
 * outside and when focus leaves it. An arrow points at the trigger.
 *
 * @attr {string} label - The panel's accessible name. Required.
 * @attr {string} placement - Where the panel opens: `bottom` (default), `top`, `start` or `end`. It flips when the side has no room.
 * @attr {boolean} open - The panel is showing.
 * @slot - The panel's content.
 * @slot trigger - The control that opens the panel.
 * @csspart panel - The floating panel.
 * @csspart arrow - The arrow pointing at the trigger.
 * @fires purr-toggle - The panel opened or closed. `detail.open` says which.
 */
export class PurrPopover extends LitElement {
  static override styles = popoverStyles;
  static override properties = {
    label: { reflect: true },
    placement: { reflect: true },
    open: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare placement: "top" | "bottom" | "start" | "end";
  declare open: boolean;

  constructor() {
    super();
    this.label = "";
    this.placement = "bottom";
    this.open = false;
    new DismissController(this, {
      enabled: () => this.open,
      onDismiss: (reason) => this.#close(reason === "escape"),
    });
    this.addEventListener("focusout", this.#onFocusout);
  }

  readonly #anchored = new AnchoredController(this, {
    anchor: () => this.#trigger ?? this,
    panel: () => this.shadowRoot!.querySelector("[part=panel]")!,
    placement: () => this.placement as Placement,
    onPlace: (side) => this.#aim(side),
  });

  get #trigger(): HTMLElement | undefined {
    return this.shadowRoot
      ?.querySelector<HTMLSlotElement>("slot[name=trigger]")
      ?.assignedElements()[0] as HTMLElement | undefined;
  }

  get #panel(): HTMLElement {
    return this.shadowRoot!.querySelector("[part=panel]")!;
  }

  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  #close(refocus: boolean) {
    this.open = false;
    if (refocus) this.#trigger?.focus();
  }

  // Focus that leaves for nowhere (a click on plain page) is the outside press's to handle.
  #onFocusout = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (this.open && next && !this.contains(next) && next !== this) {
      this.#close(false);
    }
  };

  /** Points the arrow at the middle of the trigger, measured from the panel's own edge. */
  #aim(side: Side) {
    const anchor = this.#trigger?.getBoundingClientRect();
    if (!anchor) return;
    const panel = this.#panel;
    const box = panel.getBoundingClientRect();
    const along =
      side === "top" || side === "bottom"
        ? anchor.left + anchor.width / 2 - box.left
        : anchor.top + anchor.height / 2 - box.top;
    panel.dataset.side = side;
    panel.style.setProperty("--_along", `${along}px`);
  }

  #syncTrigger() {
    const trigger = this.#trigger;
    trigger?.setAttribute("aria-haspopup", "dialog");
    trigger?.setAttribute("aria-expanded", String(this.open));
  }

  #focusInside() {
    const root = this.getRootNode() as Document | ShadowRoot;
    for (const child of this.children) {
      if (child.slot === "trigger") continue;
      for (const el of [child, ...child.querySelectorAll("*")]) {
        (el as HTMLElement).focus({ preventScroll: true });
        if (root.activeElement === el) return;
      }
    }
    this.#panel.focus({ preventScroll: true });
  }

  // Moving the element hides the panel (the anchor controller's disconnect); an open popover shows it again.
  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated && this.open) this.#anchored.show();
  }

  protected override updated(changed: PropertyValues<this>) {
    this.#syncTrigger();
    if (!changed.has("open")) {
      if (changed.has("placement") && this.open) this.#anchored.place();
      return;
    }
    // A panel that starts open is part of the page as loaded: it does not take focus or announce itself.
    const started = changed.get("open") === undefined;
    if (this.open) {
      this.#anchored.show();
      if (!started) this.#focusInside();
    } else {
      // Hiding the panel would drop focus on <body>; the trigger is where the user came from.
      const refocus =
        this.matches(":focus-within") &&
        !this.#trigger?.matches(":focus-within");
      this.#anchored.hide();
      if (refocus) this.#trigger?.focus();
    }
    if (!started) {
      this.dispatchEvent(
        new CustomEvent("purr-toggle", {
          detail: { open: this.open },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  override render() {
    return html`<slot
        name="trigger"
        @slotchange=${() => this.#syncTrigger()}
        @click=${() => (this.open = !this.open)}
      ></slot>
      <div
        part="panel"
        role="dialog"
        popover="manual"
        tabindex="-1"
        aria-label=${this.label || nothing}
      >
        <svg
          part="arrow"
          viewBox="0 0 2 1"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 1L1 0L2 1" />
        </svg>
        <slot></slot>
      </div>`;
  }
}

customElements.define("purr-popover", PurrPopover);

declare global {
  interface HTMLElementTagNameMap {
    "purr-popover": PurrPopover;
  }
}
