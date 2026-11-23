import { LitElement, html, type PropertyValues } from "lit";
import { sliderStyles } from "./slider.css.ts";
import {
  currentValue,
  fractionOf,
  toRange,
  valueAfterKey,
  valueAt,
  type Range,
} from "./slider-math.ts";

/**
 * A slider: one value chosen on a track, following the WAI-ARIA slider
 * pattern. The host is the slider and its hit region. Name it with `label`.
 * It takes part in forms: it submits `name` with its value, a form reset
 * returns it to its `value` attribute (0 without one), and a disabled
 * fieldset disables it.
 *
 * @attr {number} value - The starting value. The `value` property holds the current one.
 * @attr {number} min - The lowest value. Defaults to 0.
 * @attr {number} max - The highest value. Defaults to 100.
 * @attr {number|"any"} step - The distance between values. Defaults to 1. `any` allows every value in the range; arrow keys then move by one hundredth of the range and Page keys by one tenth.
 * @attr {number} ticks - How many tick marks to draw, spread along the track.
 * @attr {string} label - The accessible name.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {boolean} disabled - No focus, no input, nothing submitted.
 * @csspart track - The groove.
 * @csspart fill - The part of the groove up to the thumb.
 * @csspart ticks - The tick marks.
 * @csspart thumb - The knob.
 * @fires {CustomEvent<{ value: number }>} purr-input - The value changed while dragging or on a key. `detail.value` holds it.
 * @fires {CustomEvent<{ value: number }>} purr-change - The user committed a changed value, on release or on a key. `detail.value` holds it.
 */
export class PurrSlider extends LitElement {
  static formAssociated = true;
  static override styles = sliderStyles;
  static override properties = {
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    step: {
      converter: (value: string | null) =>
        value === "any" ? "any" : Number(value),
    },
    ticks: { type: Number },
    label: {},
    name: { reflect: true },
    size: { reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare value: number;
  declare min: number;
  declare max: number;
  declare step: number | "any";
  declare ticks: number;
  declare label: string;
  declare name: string;
  declare size: "md" | "lg" | "xl";
  declare disabled: boolean;

  readonly #internals = this.attachInternals();
  #startValue: number | undefined;

  constructor() {
    super();
    this.value = 0;
    this.min = 0;
    this.max = 100;
    this.step = 1;
    this.ticks = 0;
    this.label = "";
    this.name = "";
    this.size = "md";
    this.disabled = false;
    this.addEventListener("keydown", this.#onKeyDown);
    this.addEventListener("pointerdown", this.#onPointerDown);
    this.addEventListener("pointermove", this.#onPointerMove);
    this.addEventListener("pointerup", this.#onPointerUp);
    this.addEventListener("pointercancel", this.#onPointerEnd);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "slider");
    this.setAttribute("aria-orientation", "horizontal");
  }

  // A drag cannot outlive the element: its pointer release no longer arrives.
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#internals.states.delete("dragging");
    this.#startValue = undefined;
  }

  formResetCallback() {
    this.value = Number(this.getAttribute("value") ?? 0);
  }

  formStateRestoreCallback(state: string) {
    this.value = Number(state);
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  get #range(): Range {
    return toRange(this.min, this.max, this.step);
  }

  // What is shown and submitted; `value` itself may be off the grid or out of range.
  get #current() {
    return currentValue(this.value, this.#range);
  }

  get #rtl() {
    return getComputedStyle(this).direction === "rtl";
  }

  #emit(name: "purr-input" | "purr-change") {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #set(value: number) {
    if (value === this.#current) return;
    this.value = value;
    this.#emit("purr-input");
  }

  #onKeyDown = (event: KeyboardEvent) => {
    if (
      this.matches(":disabled") ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }
    const next = valueAfterKey(
      event.key,
      this.#current,
      this.#range,
      this.#rtl,
    );
    if (next === undefined) return;
    event.preventDefault();
    const before = this.#current;
    this.#set(next);
    if (this.#current !== before) this.#emit("purr-change");
  };

  #setFromPointer(event: PointerEvent) {
    // The thumb's center travels from half a thumb in to half a thumb in.
    const thumb =
      this.shadowRoot!.querySelector<HTMLElement>('[part="thumb"]')!;
    const box = this.getBoundingClientRect();
    const room = box.width - thumb.offsetWidth;
    this.#set(
      valueAt(
        room > 0
          ? (event.clientX - box.left - thumb.offsetWidth / 2) / room
          : 0,
        this.#range,
        this.#rtl,
      ),
    );
  }

  #onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || this.matches(":disabled")) return;
    this.setPointerCapture(event.pointerId);
    this.#internals.states.add("dragging");
    this.#startValue = this.#current;
    this.focus();
    // A touch may turn into a scroll: it counts only once it lifts.
    if (event.pointerType !== "touch") this.#setFromPointer(event);
  };

  #onPointerMove = (event: PointerEvent) => {
    if (this.hasPointerCapture(event.pointerId) && !this.matches(":disabled")) {
      this.#setFromPointer(event);
    }
  };

  #onPointerUp = (event: PointerEvent) => {
    if (event.pointerType === "touch" && this.#startValue !== undefined) {
      this.#setFromPointer(event);
    }
    this.#onPointerEnd();
  };

  #onPointerEnd = () => {
    if (this.#startValue === undefined) return;
    this.#internals.states.delete("dragging");
    if (this.#current !== this.#startValue) this.#emit("purr-change");
    this.#startValue = undefined;
  };

  protected override updated(changed: PropertyValues<this>) {
    const disabled = this.matches(":disabled");
    this.tabIndex = disabled ? -1 : 0;
    const { min, max } = this.#range;
    this.setAttribute("aria-valuemin", String(min));
    this.setAttribute("aria-valuemax", String(max));
    this.setAttribute("aria-valuenow", String(this.#current));
    if (this.label) this.setAttribute("aria-label", this.label);
    else if (changed.get("label")) this.removeAttribute("aria-label");
    if (disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    this.style.setProperty(
      "--_p",
      String(fractionOf(this.#current, this.#range)),
    );
    this.#internals.setFormValue(String(this.#current));
  }

  override render() {
    const marks = Math.max(0, Math.floor(this.ticks));
    return html`<span part="track"><span part="fill"></span></span>${
        marks > 1
          ? html`<span part="ticks"
              >${Array.from(
                { length: marks },
                (_, i) => html`<span style="--_i:${i / (marks - 1)}"></span>`,
              )}</span
            >`
          : null
      }<span part="thumb"></span>`;
  }
}

customElements.define("purr-slider", PurrSlider);

declare global {
  interface HTMLElementTagNameMap {
    "purr-slider": PurrSlider;
  }
}
