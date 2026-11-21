import { LitElement, html } from "lit";
import type { PropertyValues } from "lit";
import { AnchoredController } from "../../behaviors/anchored.ts";
import { DismissController } from "../../behaviors/dismiss.ts";
import type { Placement } from "../../behaviors/position.ts";
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
 * cannot reach into a shadow root.
 *
 * @attr {string} text - What the bubble says. Required.
 * @attr {string} placement - `bottom` (default), `top`, `start` or `end`. It flips when the side has no room.
 * @slot - The target: a control, or anything the pointer or focus can reach.
 * @csspart bubble - The floating box. Invisible: its padding is the gap to the target.
 * @csspart face - The visible bubble.
 */
export class PurrTooltip extends LitElement {
  static override styles = tooltipStyles;
  static override properties = {
    text: { reflect: true },
    placement: { reflect: true },
    shown: { state: true },
  };

  declare text: string;
  declare placement: "top" | "bottom" | "start" | "end";
  declare shown: boolean;

  readonly #tip = document.createElement("span");
  #target: Element | undefined;
  #timer: ReturnType<typeof setTimeout> | undefined;

  readonly #anchored = new AnchoredController(this, {
    anchor: () => this.#target ?? this,
    panel: () => this.shadowRoot!.querySelector("[part=bubble]")!,
    placement: () => this.placement as Placement,
  });

  constructor() {
    super();
    this.text = "";
    this.placement = "bottom";
    this.shown = false;
    this.#tip.slot = "tip";
    this.#tip.role = "tooltip";
    this.#tip.id = `purr-tooltip-${++count}`;
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
    if (!event.composedPath().includes(this.#tip)) this.#hide();
  };

  /** Names the bubble as the target's description, keeping any description the target already has. */
  #describe = (event: Event) => {
    const target = (event.target as HTMLSlotElement).assignedElements()[0];
    this.#reference(this.#target, false);
    this.#target = target;
    this.#reference(target, true);
  };

  #reference(target: Element | undefined, on: boolean) {
    if (!target) return;
    const ids = new Set(target.getAttribute("aria-describedby")?.split(/\s+/));
    ids.delete("");
    if (on) ids.add(this.#tip.id);
    else ids.delete(this.#tip.id);
    if (ids.size) target.setAttribute("aria-describedby", [...ids].join(" "));
    else target.removeAttribute("aria-describedby");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.append(this.#tip);
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
      if (changed.has("placement") && this.shown) this.#anchored.place();
      return;
    }
    if (this.shown) this.#anchored.show();
    else this.#anchored.hide();
  }

  override render() {
    return html`<slot @slotchange=${this.#describe}></slot>
      <div part="bubble" popover="manual">
        <div part="face"><slot name="tip"></slot></div>
      </div>`;
  }
}

customElements.define("purr-tooltip", PurrTooltip);

declare global {
  interface HTMLElementTagNameMap {
    "purr-tooltip": PurrTooltip;
  }
}
