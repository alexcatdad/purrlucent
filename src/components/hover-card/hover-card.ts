import { LitElement, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { AnchoredController } from "../../behaviors/anchored.ts";
import { DismissController } from "../../behaviors/dismiss.ts";
import type { Placement, Side } from "../../behaviors/position.ts";
import { hoverCardStyles } from "./hover-card.css.ts";

/**
 * Supplementary content that previews what its trigger points at: a floating
 * card anchored to the trigger. It opens after a short delay when the pointer
 * rests on the trigger or keyboard focus reaches it, and at once on a press.
 * On a touch screen a first tap on the trigger opens it instead of activating
 * the trigger; a tap while it is open activates the trigger as usual. It stays
 * open while the pointer or focus is on the trigger or inside the card, and
 * closes after a short delay when both have left, on Escape (focus that was in
 * the card returns to the trigger) and on a press outside. Nothing is
 * reachable only by hover, but the card is supplementary: what it says must
 * also be available without it, and it never holds the only way to do
 * something.
 *
 * The element sets `aria-expanded` on the trigger. The card is a group, named
 * by `label` when you give one, in the reading order right after the trigger:
 * an id reference cannot reach into a shadow root, so the trigger is not
 * given `aria-describedby`.
 *
 * @attr {string} label - The card's accessible name. Optional.
 * @attr {string} placement - Where the card opens: `bottom` (default), `top`, `start` or `end`. It flips when the side has no room.
 * @attr {boolean} open - The card is showing. Opening it closes any other open hover card in the same document or shadow root, except one that holds it or sits inside it.
 * @slot - The card's content.
 * @slot trigger - The control or link the card is about.
 * @csspart panel - The floating card.
 * @csspart arrow - The arrow pointing at the trigger.
 * @cssprop --pl-hover-card-open-delay - How long the pointer or focus must rest on the trigger before the card opens. Default `700ms`.
 * @cssprop --pl-hover-card-close-delay - How long the card waits after the pointer and focus have both left before it closes. Default `300ms`.
 * @fires {CustomEvent<{ open: boolean }>} pl-toggle - The card opened or closed. `detail.open` says which.
 */
export class PlHoverCard extends LitElement {
  static override styles = hoverCardStyles;
  static override properties = {
    label: { reflect: true },
    placement: { reflect: true },
    open: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare placement: "top" | "bottom" | "start" | "end";
  declare open: boolean;

  // The pointer, or focus, is on the trigger or in the card.
  #hovered = false;
  #focused = false;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #pointerType = "";
  #refocusing = false;

  constructor() {
    super();
    this.label = "";
    this.placement = "bottom";
    this.open = false;
    new DismissController(this, {
      enabled: () => this.open,
      onDismiss: () => this.#dismiss(),
    });
    this.addEventListener("pointerenter", this.#onEnter);
    this.addEventListener("pointerleave", this.#onLeave);
    this.addEventListener("pointerdown", this.#onPointerdown);
    this.addEventListener("keydown", () => (this.#pointerType = ""));
    this.addEventListener("focusin", this.#onFocusin);
    this.addEventListener("focusout", this.#onFocusout);
    this.addEventListener("click", this.#onClick, { capture: true });
  }

  readonly #anchored = new AnchoredController(this, {
    anchor: () => this.#trigger ?? this,
    panel: () => this.#panel,
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

  // Read from a transition-delay (open, then close) so the browser resolves the tokens' units and calc().
  #delay(opening: boolean) {
    const value = getComputedStyle(this)
      .transitionDelay.split(",")
      [opening ? 0 : 1]?.trim();
    return value
      ? parseFloat(value) * (value.endsWith("ms") ? 1 : 1000) || 0
      : 0;
  }

  /** Moves toward what the pointer and focus say: open while either is on the card, closed once both have left. */
  #settle() {
    clearTimeout(this.#timer);
    const want = this.#hovered || this.#focused;
    if (want === this.open) return;
    const delay = this.#delay(want);
    this.#timer = setTimeout(() => (this.open = want), delay);
  }

  // Closing by Escape or a press outside forgets the hover and focus that opened the card, so nothing reopens it until the pointer or focus comes back.
  #dismiss() {
    clearTimeout(this.#timer);
    this.#hovered = this.#focused = false;
    this.open = false;
  }

  // A touch is not a hover: it opens through the click handler.
  #onEnter = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    this.#hovered = true;
    this.#settle();
  };

  #onLeave = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    this.#hovered = false;
    this.#settle();
  };

  #onPointerdown = (event: PointerEvent) => {
    this.#pointerType = event.pointerType;
  };

  // Focus on the trigger opens it only for the keyboard; focus in the card keeps it open however it got there.
  #onFocusin = (event: FocusEvent) => {
    if (this.#refocusing) return;
    const target = event.target as Element;
    const inTrigger = !!this.#trigger?.contains(target);
    if (inTrigger && !target.matches(":focus-visible")) return;
    this.#focused = true;
    this.#settle();
  };

  #onFocusout = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && this.contains(next)) return;
    this.#focused = false;
    this.#settle();
  };

  // A press opens it at once. The first tap on a touch screen only opens it: the trigger's own action waits for the next tap.
  #onClick = (event: MouseEvent) => {
    const trigger = this.#trigger;
    if (!trigger || !event.composedPath().includes(trigger)) return;
    const touch = this.#pointerType === "touch";
    this.#pointerType = "";
    if (this.open) return;
    clearTimeout(this.#timer);
    this.open = true;
    if (touch) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  // One card shows at a time. A card nested in this one, or holding it, stays as it is.
  #closeOthers() {
    const root = this.getRootNode() as Document | ShadowRoot;
    for (const other of root.querySelectorAll("pl-hover-card")) {
      if (other.open && !other.contains(this) && !this.contains(other)) {
        other.open = false;
      }
    }
  }

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
    this.#trigger?.setAttribute("aria-expanded", String(this.open));
  }

  // Moving the element hides the panel (the anchor controller's disconnect); an open card shows it again.
  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated && this.open) this.#anchored.show();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#timer);
    this.#hovered = this.#focused = false;
  }

  protected override updated(changed: PropertyValues<this>) {
    this.#syncTrigger();
    if (!changed.has("open")) {
      if (changed.has("placement") && this.open) this.#anchored.place();
      return;
    }
    // A card that starts open is part of the page as loaded: it does not announce itself.
    const started = changed.get("open") === undefined;
    if (this.open) {
      if (!started) this.#closeOthers();
      this.#anchored.show();
    } else {
      // Hiding the panel would drop focus on <body>; the trigger is where the user came from.
      // The active element, not :focus-within: that pseudo-class needs the page itself to have focus.
      const root = this.getRootNode() as Document | ShadowRoot;
      const active = root.activeElement;
      const refocus =
        !!active && this.contains(active) && !this.#trigger?.contains(active);
      this.#anchored.hide();
      if (refocus) {
        // Focus returning to the trigger is not the keyboard arriving: it must not reopen the card.
        this.#refocusing = true;
        this.#trigger?.focus();
        this.#refocusing = false;
      }
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
      ></slot>
      <div
        part="panel"
        role="group"
        popover="manual"
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

customElements.define("pl-hover-card", PlHoverCard);

declare global {
  interface HTMLElementTagNameMap {
    "pl-hover-card": PlHoverCard;
  }
}
