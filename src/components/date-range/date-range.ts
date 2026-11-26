import { LitElement, html } from "lit";
import { PlDatePicker, dateRangeLink } from "../date-picker/date-picker.ts";
import { dateRangeStyles } from "./date-range.css.ts";

/**
 * Pairs two date pickers. When both fields are enabled and contain available
 * dates, an editable end must be on or after the start. The end field shows
 * the order error and blocks form submission. Each picker retains its own
 * name, bounds, required state, reset value and labels. The calendar triggers
 * default to distinct accessible names, which each picker can override with
 * `calendar-label`.
 *
 * @slot start - The `pl-date-picker` for the first day of the range.
 * @slot end - The `pl-date-picker` for the last day of the range.
 */
export class PlDateRange extends LitElement {
  static override styles = dateRangeStyles;

  #start: PlDatePicker | undefined;
  #end: PlDatePicker | undefined;

  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) this.#link();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#unlink();
  }

  #unlink() {
    this.#start?.[dateRangeLink](this);
    this.#end?.[dateRangeLink](this);
    this.#start = undefined;
    this.#end = undefined;
  }

  #picker(endpoint: "start" | "end") {
    return this.renderRoot
      .querySelector<HTMLSlotElement>(`slot[name=${endpoint}]`)
      ?.assignedElements()
      .find((element) => element instanceof PlDatePicker);
  }

  #link = () => {
    if (!this.isConnected) return;
    const start = this.#picker("start");
    const end = this.#picker("end");
    if (start === this.#start && end === this.#end) return;
    this.#unlink();
    this.#start = start;
    this.#end = end;
    start?.[dateRangeLink](this, { endpoint: "start", peer: end });
    end?.[dateRangeLink](this, { endpoint: "end", peer: start });
  };

  override render() {
    return html`<slot name="start" @slotchange=${this.#link}></slot>
      <slot name="end" @slotchange=${this.#link}></slot>`;
  }
}

customElements.define("pl-date-range", PlDateRange);

declare global {
  interface HTMLElementTagNameMap {
    "pl-date-range": PlDateRange;
  }
}
