import { LitElement, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { AnchoredController } from "../../behaviors/anchored.ts";
import { DismissController } from "../../behaviors/dismiss.ts";
import { LensController } from "../../behaviors/lens.ts";
import { withAlign } from "../../behaviors/position.ts";
import type { Align, Side } from "../../behaviors/position.ts";
import { popoverStyles } from "./popover.css.ts";

/**
 * A non-modal floating panel anchored to a trigger. The trigger is any
 * focusable control in the `trigger` slot; the element sets `aria-haspopup`
 * and `aria-expanded` on it. The panel is a dialog named by `label`: it opens
 * on a press of the trigger, takes focus to its first focusable content (or to
 * itself), and closes on Escape (focus returns to the trigger), on a press
 * outside and when focus leaves it. An arrow points at the trigger. The panel
 * is as wide as its content, from a minimum that keeps the arrow clear of the
 * corners up to a maximum of `--pl-popover-max-inline-size`, and never wider
 * than the viewport; longer content wraps.
 *
 * @attr {string} label - The panel's accessible name. Required.
 * @attr {string} placement - Where the panel opens: `bottom` (default), `top`, `start` or `end`. It flips when the side has no room.
 * @attr {string} align - How the panel lines up with the trigger on a `top` or `bottom` placement: `center` (default), `start` or `end` edge. `start` and `end` follow the text direction. It has no effect beside the trigger.
 * @attr {boolean} open - The panel is showing. Opening it closes any other open popover in the same document or shadow root, except one that holds it or sits inside it.
 * @slot - The panel's content.
 * @slot trigger - The control that opens the panel.
 * @csspart panel - The floating panel.
 * @csspart arrow - The arrow pointing at the trigger.
 * @cssprop --pl-popover-max-inline-size - The widest the panel grows before its content wraps. Default `calc(var(--pl-spacing) * 45)`.
 * @fires {CustomEvent<{ open: boolean }>} pl-toggle - The panel opened or closed. `detail.open` says which.
 */
export class PlPopover extends LitElement {
  static override styles = popoverStyles;
  static override properties = {
    label: { reflect: true },
    placement: { reflect: true },
    align: { reflect: true },
    open: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare placement: "top" | "bottom" | "start" | "end";
  declare align: Align;
  declare open: boolean;

  constructor() {
    super();
    new LensController(this, () =>
      this.renderRoot.querySelector<HTMLElement>("[part=panel]"),
    );
    this.label = "";
    this.placement = "bottom";
    this.align = "center";
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
    placement: () => withAlign(this.placement, this.align),
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

  // One popover shows at a time. A popover nested in this one, or holding it, stays as it is.
  #closeOthers() {
    const root = this.getRootNode() as Document | ShadowRoot;
    for (const other of root.querySelectorAll("pl-popover")) {
      if (other.open && !other.contains(this) && !this.contains(other)) {
        other.open = false;
      }
    }
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
      if ((changed.has("placement") || changed.has("align")) && this.open)
        this.#anchored.place();
      return;
    }
    // A panel that starts open is part of the page as loaded: it does not take focus or announce itself.
    const started = changed.get("open") === undefined;
    if (this.open) {
      if (!started) this.#closeOthers();
      this.#anchored.show();
      if (!started) this.#focusInside();
    } else {
      // Hiding the panel would drop focus on <body>; the trigger is where the user came from.
      // The active element, not :focus-within: that pseudo-class needs the page itself to have focus.
      const root = this.getRootNode() as Document | ShadowRoot;
      const active = root.activeElement;
      const refocus =
        !!active && this.contains(active) && !this.#trigger?.contains(active);
      this.#anchored.hide();
      if (refocus) this.#trigger?.focus();
    }
    if (!started) {
      this.dispatchEvent(
        new CustomEvent("pl-toggle", {
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

customElements.define("pl-popover", PlPopover);

declare global {
  interface HTMLElementTagNameMap {
    "pl-popover": PlPopover;
  }
}
