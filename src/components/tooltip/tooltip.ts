import { LitElement, html } from "lit";
import type { PropertyValues } from "lit";
import { AnchoredController } from "../../behaviors/anchored.ts";
import { DismissController } from "../../behaviors/dismiss.ts";
import { withAlign } from "../../behaviors/position.ts";
import type { Align } from "../../behaviors/position.ts";
import { tooltipStyles } from "./tooltip.css.ts";

let count = 0;

/**
 * Shows `text` in a small bubble beside its content (the target): after a
 * delay on hover, at once on keyboard focus. It hides on pointer leave, blur,
 * Escape and a press, and the pointer can move onto the bubble without
 * hiding it. It never shows for touch, so a tap always reaches the target.
 *
 * The bubble is a `role="tooltip"` element that the tooltip adds to its own
 * children, so the target can name it in `aria-describedby`: an id reference
 * cannot reach into a shadow root. For more than a line of text, put one
 * non-interactive element (a `<div>` holding a `<dl>` or several lines) in the
 * `content` slot: it becomes the `role="tooltip"` element and `text` is not
 * used. Not the `<dl>` itself: `role="tooltip"` on it breaks its list semantics. The bubble
 * wraps at `--pl-tooltip-max-inline-size`.
 *
 * @attr {string} text - What the bubble says. Required unless the `content` slot is used.
 * @attr {string} placement - `bottom` (default), `top`, `start` or `end`. It flips when the side has no room.
 * @attr {string} align - How the bubble lines up with the target on a `top` or `bottom` placement: `center` (default), `start` or `end` edge. `start` and `end` follow the text direction. It has no effect beside the target.
 * @slot - The target: a control, or anything the pointer or focus can reach.
 * @slot content - Rich, non-interactive content for the bubble, in place of `text`.
 * @cssprop --pl-tooltip-open-delay - How long the pointer must rest on the target before the bubble shows. Default `560ms`. Keyboard focus shows it at once.
 * @cssprop --pl-tooltip-max-inline-size - The widest the bubble grows before its content wraps. Default `calc(var(--pl-spacing) * 60)`.
 * @csspart bubble - The floating box. Invisible: its padding is the gap to the target.
 * @csspart face - The visible bubble.
 */
export class PlTooltip extends LitElement {
  static override styles = tooltipStyles;
  static override properties = {
    text: { reflect: true },
    placement: { reflect: true },
    align: { reflect: true },
    shown: { state: true },
  };

  declare text: string;
  declare placement: "top" | "bottom" | "start" | "end";
  declare align: Align;
  declare shown: boolean;

  readonly #tip = document.createElement("span");
  #target: Element | undefined;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #rich: Element | undefined;
  #described = "";

  readonly #anchored = new AnchoredController(this, {
    anchor: () => this.#target ?? this,
    panel: () => this.shadowRoot!.querySelector("[part=bubble]")!,
    placement: () => withAlign(this.placement, this.align),
  });

  constructor() {
    super();
    this.text = "";
    this.placement = "bottom";
    this.align = "center";
    this.shown = false;
    this.#tip.slot = "tip";
    this.#tip.role = "tooltip";
    this.#tip.id = `pl-tooltip-${++count}`;
    new DismissController(this, {
      enabled: () => this.shown,
      onDismiss: () => this.#hide(),
    });
    this.addEventListener("pointerenter", this.#onEnter);
    this.addEventListener("pointerleave", this.#hide);
    this.addEventListener("focusin", this.#onFocusin);
    this.addEventListener("focusout", this.#hide);
    this.addEventListener("pointerdown", this.#onPress);
  }

  // Read from a transition-delay so the browser resolves the token's calc().
  #delay() {
    const value = getComputedStyle(this).transitionDelay;
    return parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
  }

  #show(delay: number) {
    clearTimeout(this.#timer);
    if (delay) this.#timer = setTimeout(() => (this.shown = true), delay);
    else this.shown = true;
  }

  #hide = () => {
    clearTimeout(this.#timer);
    this.shown = false;
  };

  #onEnter = (event: PointerEvent) => {
    if (event.pointerType !== "touch" && !this.shown) this.#show(this.#delay());
  };

  #onFocusin = (event: FocusEvent) => {
    if ((event.target as Element).matches(":focus-visible")) this.#show(0);
  };

  #onPress = (event: PointerEvent) => {
    if (!event.composedPath().includes(this.#rich ?? this.#tip)) this.#hide();
  };

  /** Names the bubble as the target's description, keeping any description the target already has. */
  #describe = (event: Event) => {
    const target = (event.target as HTMLSlotElement).assignedElements()[0];
    this.#reference(this.#target, false);
    this.#target = target;
    this.#reference(target, true);
  };

  /** Makes the `content` element the bubble's text element, or hands that role back to the built-in one. */
  #onContent = (event: Event) => {
    this.#reference(this.#target, false);
    const rich = (event.target as HTMLSlotElement).assignedElements()[0];
    this.#rich = rich;
    if (rich) {
      rich.id ||= `pl-tooltip-${++count}`;
      if (!rich.hasAttribute("role")) rich.setAttribute("role", "tooltip");
      this.#tip.remove();
    } else if (this.isConnected) {
      this.append(this.#tip);
    }
    this.#reference(this.#target, true);
  };

  #reference(target: Element | undefined, on: boolean) {
    if (!target) return;
    const ids = new Set(target.getAttribute("aria-describedby")?.split(/\s+/));
    ids.delete("");
    ids.delete(this.#described);
    if (on) ids.add((this.#described = (this.#rich ?? this.#tip).id));
    if (ids.size) target.setAttribute("aria-describedby", [...ids].join(" "));
    else target.removeAttribute("aria-describedby");
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.#rich) this.append(this.#tip);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#tip.remove();
    this.#hide();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has("text")) this.#tip.textContent = this.text;
  }

  protected override updated(changed: PropertyValues<this>) {
    if (!changed.has("shown")) {
      if ((changed.has("placement") || changed.has("align")) && this.shown)
        this.#anchored.place();
      return;
    }
    if (this.shown) this.#anchored.show();
    else this.#anchored.hide();
  }

  override render() {
    return html`<slot @slotchange=${this.#describe}></slot>
      <div part="bubble" popover="manual">
        <div part="face">
          <slot name="tip"></slot>
          <slot name="content" @slotchange=${this.#onContent}></slot>
        </div>
      </div>`;
  }
}

customElements.define("pl-tooltip", PlTooltip);

declare global {
  interface HTMLElementTagNameMap {
    "pl-tooltip": PlTooltip;
  }
}
