import { LitElement, html, nothing, svg } from "lit";
import type { PropertyValues } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { backGlyph } from "../../behaviors/glyphs.ts";
import { fill, localeOf, messages } from "../../behaviors/locale.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import "../button/button.ts";
import "../popover/popover.ts";
import type { PlPopover } from "../popover/popover.ts";
import { monthRangePickerStyles } from "./month-range-picker.css.ts";
import {
  clampMonth,
  monthTime,
  parseMonth,
  parseRange,
  thisMonth,
  toMonth,
  toRange,
} from "./months.ts";

const forwardGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6 6.5-6 6.5" /></svg>`;

/** A formatter for months in the Gregorian calendar, at UTC. */
const monthFormat = (locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, {
    ...options,
    calendar: "gregory",
    timeZone: "UTC",
  });

/**
 * Chooses a range of whole months, one year at a time. The months of the year
 * on show are a `grid` of three columns with one tab stop. The first month
 * chosen starts the range and the second ends it, in either order; the value is
 * always ordered. Leaving the picker after one month, or closing its popover,
 * chooses that month alone. The arrow keys move by a month (Up and Down by a
 * row), Page Up and Page Down by a year, Home and End go to January and
 * December, and Enter or Space chooses. Month names and the direction follow
 * the locale.
 *
 * By default it is a button that shows the range and opens the months in a
 * popover; with `inline` the months show in place. It takes part in forms like
 * a native input: it submits `name` with its value and a reset returns it to
 * its `value` attribute.
 *
 * @attr {string} value - The range, `yyyy-mm/yyyy-mm` with the start first, or empty. A single month is the same month twice. The `value` property holds the current one.
 * @attr {string} min - The earliest month that can be chosen, `yyyy-mm`.
 * @attr {string} max - The latest month that can be chosen, `yyyy-mm`.
 * @attr {boolean} inline - Shows the months in place instead of a button and a popover.
 * @attr {boolean} clearable - Shows a Clear button that empties the value.
 * @attr {boolean} disabled - Nothing can be chosen and the value is not submitted.
 * @attr {string} label - The accessible name of the button and the months. Defaults to the page language's text (see `setMessages`), in English "Choose months".
 * @attr {string} placeholder - The button's text while the value is empty. Defaults to the label.
 * @attr {string} locale - A BCP 47 tag for month names and direction. Defaults to the closest `lang`, else the document's, else the browser's.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} prev-label - The previous year button's accessible name. Defaults to the page language's text (see `setMessages`), in English "Previous year".
 * @attr {string} next-label - The next year button's accessible name. Defaults to the page language's text (see `setMessages`), in English "Next year".
 * @attr {string} clear-label - The Clear button's text. Defaults to the page language's text (see `setMessages`), in English "Clear".
 * @csspart trigger - The button that opens the popover.
 * @csspart panel - The months and their header.
 * @csspart header - The row with the year buttons and the year.
 * @csspart title - The year.
 * @csspart nav - A year button.
 * @csspart grid - The table of months.
 * @csspart month - A month cell.
 * @csspart clear - The Clear button.
 * @fires {CustomEvent<{ value: string; start: string; end: string }>} pl-change - A range was chosen or cleared. `detail.start` and `detail.end` are `yyyy-mm`, or empty when cleared. Choosing the range that is already chosen fires nothing.
 * @fires input - After each pl-change, as a native input fires it.
 * @fires change - After each pl-change, as a native input fires it.
 */
export class PlMonthRangePicker extends LitElement {
  static formAssociated = true;
  static override styles = monthRangePickerStyles;
  static override properties = {
    value: {},
    min: { reflect: true },
    max: { reflect: true },
    inline: { type: Boolean, reflect: true },
    clearable: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    label: {},
    placeholder: {},
    locale: { reflect: true },
    name: { reflect: true },
    prevLabel: { attribute: "prev-label" },
    nextLabel: { attribute: "next-label" },
    clearLabel: { attribute: "clear-label" },
    _focus: { state: true },
    _anchor: { state: true },
  };

  declare value: string;
  declare min: string | undefined;
  declare max: string | undefined;
  declare inline: boolean;
  declare clearable: boolean;
  declare disabled: boolean;
  declare label: string;
  declare placeholder: string;
  declare locale: string | undefined;
  declare name: string;
  declare prevLabel: string;
  declare nextLabel: string;
  declare clearLabel: string;
  /** The month index that holds the tab stop, and with it the year on show; -1 until one is chosen or focused. */
  declare _focus: number;
  /** The first month of a range still being chosen, or -1. */
  declare _anchor: number;

  readonly #internals = this.attachInternals();

  constructor() {
    super();
    this.value = "";
    this.inline = false;
    this.clearable = false;
    this.disabled = false;
    this.label = "";
    this.placeholder = "";
    this.name = "";
    this.prevLabel = "";
    this.nextLabel = "";
    this.clearLabel = "";
    this._focus = -1;
    this._anchor = -1;
  }

  get form() {
    return this.#internals.form;
  }

  formResetCallback() {
    this._anchor = -1;
    this.value = this.getAttribute("value") ?? "";
  }

  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  /** Moves focus to the month that holds the tab stop. */
  async focusMonth() {
    await this.updateComplete;
    this.renderRoot
      .querySelector<HTMLElement>('[part~="month"][tabindex="0"]')
      ?.focus();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (!changed.has("value")) return;
    const range = parseRange(this.value);
    // A value is always stored ordered and complete, or empty.
    this.value = range ? toRange(...range) : "";
    // A new range from outside shows its start; the picker's own keeps the year on show.
    if (range && !(this._focus >= range[0] && this._focus <= range[1]))
      this._focus = range[0];
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has("value")) this.#internals.setFormValue(this.value || null);
  }

  get #off() {
    return this.disabled || this.matches(":disabled");
  }

  get #locale() {
    return localeOf(this, this.locale);
  }

  get #min() {
    return parseMonth(this.min);
  }

  get #max() {
    return parseMonth(this.max);
  }

  /** The month with the tab stop: the last chosen or moved to, else the start, else this month, inside min and max. */
  get #focusMonth() {
    const start =
      this._focus >= 0
        ? this._focus
        : (parseRange(this.value)?.[0] ?? thisMonth());
    return clampMonth(start, this.#min, this.#max);
  }

  #unavailable(index: number) {
    const min = this.#min;
    const max = this.#max;
    return (
      (min !== undefined && index < min) || (max !== undefined && index > max)
    );
  }

  get #popover() {
    return this.renderRoot.querySelector<PlPopover>("pl-popover");
  }

  #commit(value: string) {
    this._anchor = -1;
    if (value === this.value) return;
    this.value = value;
    const range = parseRange(value);
    this.dispatchEvent(
      new CustomEvent("pl-change", {
        detail: {
          value,
          start: range ? toMonth(range[0]) : "",
          end: range ? toMonth(range[1]) : "",
        },
        bubbles: true,
        composed: true,
      }),
    );
    fireNative(this, "input", "change");
  }

  /** Chooses the pending first month alone, when one is pending. */
  #settle() {
    if (this._anchor >= 0) this.#commit(toRange(this._anchor, this._anchor));
  }

  #pick(index: number) {
    if (this.#off || this.#unavailable(index)) return;
    this._focus = index;
    if (this._anchor < 0) {
      this._anchor = index;
      return;
    }
    this.#commit(toRange(this._anchor, index));
    this.#popover?.hide();
  }

  #clear = () => {
    this.#commit("");
    void this.focusMonth();
  };

  async #moveTo(index: number) {
    this._focus = clampMonth(index, this.#min, this.#max);
    await this.focusMonth();
  }

  /** A year button is off when no month of the year it leads to can be chosen. */
  #navOff(years: number) {
    const year = Math.floor(this.#focusMonth / 12);
    const min = this.#min;
    const max = this.#max;
    return years < 0
      ? min !== undefined && min >= year * 12
      : max !== undefined && max <= year * 12 + 11;
  }

  #shift(years: number) {
    if (this.#off || this.#navOff(years)) return;
    this._focus = clampMonth(
      this.#focusMonth + years * 12,
      this.#min,
      this.#max,
    );
  }

  #onKeydown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const at = (event.target as HTMLElement)
      .closest<HTMLElement>("[data-month]")
      ?.getAttribute("data-month");
    if (at == null) return;
    const from = Number(at);
    const rtl = this.matches(":dir(rtl)");
    const yearStart = from - (from % 12);
    const steps: Record<string, number> = {
      ArrowLeft: from + (rtl ? 1 : -1),
      ArrowRight: from + (rtl ? -1 : 1),
      ArrowUp: from - 3,
      ArrowDown: from + 3,
      Home: yearStart,
      End: yearStart + 11,
      PageUp: from - 12,
      PageDown: from + 12,
    };
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.#pick(from);
    } else if (steps[event.key] !== undefined) {
      event.preventDefault();
      void this.#moveTo(steps[event.key]!);
    }
  };

  /** A pointer is down inside the panel. Safari does not focus a pressed button, so focus leaves with no target. */
  #pressing = false;

  #onPointerdown = () => {
    this.#pressing = true;
    const release = () => (this.#pressing = false);
    addEventListener("pointerup", release, { once: true, capture: true });
    addEventListener("pointercancel", release, { once: true, capture: true });
  };

  // Inline, leaving the picker after one month chooses that month.
  #onFocusout = (event: FocusEvent) => {
    if (!this.inline) return;
    const next = event.relatedTarget as Node | null;
    if (next ? next === this || this.renderRoot.contains(next) : this.#pressing)
      return;
    this.#settle();
  };

  #onToggle = (event: CustomEvent<{ open: boolean }>) => {
    event.stopPropagation();
    if (event.detail.open) void this.focusMonth();
    else this.#settle();
  };

  /** The value as the locale writes a range of months, or empty. */
  #text() {
    const range = parseRange(this.value);
    if (!range) return "";
    const format = monthFormat(this.#locale, {
      month: "short",
      year: "numeric",
    });
    const [start, end] = range.map(monthTime) as [number, number];
    return start === end
      ? format.format(start)
      : format.formatRange(start, end);
  }

  #panel() {
    const text = messages(this);
    const locale = this.#locale;
    const focus = this.#focusMonth;
    const year = Math.floor(focus / 12);
    const title = monthFormat(locale, { year: "numeric" }).format(
      monthTime(year * 12),
    );
    const short = monthFormat(locale, { month: "short" });
    const long = monthFormat(locale, { month: "long", year: "numeric" });
    const now = thisMonth();
    const range = parseRange(this.value);
    const [start, end] =
      this._anchor >= 0 ? [this._anchor, this._anchor] : (range ?? [-1, -1]);
    const off = this.#off;

    const cell = (index: number) => {
      const unavailable = this.#unavailable(index);
      const chosen = index >= start && index <= end;
      const edge = [
        index === start ? "start" : "",
        index === end ? "end" : "",
      ].filter(Boolean);
      return html`<td
        part=${["month", ...edge, chosen && !edge.length ? "between" : ""]
          .filter(Boolean)
          .join(" ")}
        role="gridcell"
        data-month=${index}
        tabindex=${index === focus && !off ? 0 : -1}
        aria-selected=${chosen ? "true" : "false"}
        aria-disabled=${unavailable || off ? "true" : nothing}
        aria-current=${index === now ? "date" : nothing}
        @click=${() => this.#pick(index)}
      >
        <span aria-hidden="true">${short.format(monthTime(index))}</span
        ><span class="name">${long.format(monthTime(index))}</span>
      </td>`;
    };

    return html`<div
      part="panel"
      @focusout=${this.#onFocusout}
      @pointerdown=${this.#onPointerdown}
    >
      <div part="header">
        <button
          part="nav"
          type="button"
          aria-label=${this.prevLabel || text.previousYear}
          aria-disabled=${off || this.#navOff(-1) ? "true" : nothing}
          @click=${() => this.#shift(-1)}
        >
          ${backGlyph}
        </button>
        <div part="title" id="title" aria-live="polite">${title}</div>
        <button
          part="nav"
          type="button"
          aria-label=${this.nextLabel || text.nextYear}
          aria-disabled=${off || this.#navOff(1) ? "true" : nothing}
          @click=${() => this.#shift(1)}
        >
          ${forwardGlyph}
        </button>
      </div>
      <table
        part="grid"
        role="grid"
        aria-label=${fill(text.labelValue, {
          label: this.label || text.chooseMonths,
          value: title,
        })}
        aria-multiselectable="true"
        @keydown=${this.#onKeydown}
      >
        <tbody>
          ${[0, 1, 2, 3].map(
            (row) =>
              html`<tr>
                ${[0, 1, 2].map((col) => cell(year * 12 + row * 3 + col))}
              </tr>`,
          )}
        </tbody>
      </table>
      ${
        this.clearable
          ? html`<pl-button
              part="clear"
              variant="ghost"
              size="sm"
              ?disabled=${off || (!this.value && this._anchor < 0)}
              @pl-press=${this.#clear}
              >${this.clearLabel || text.clear}</pl-button
            >`
          : nothing
      }
    </div>`;
  }

  override render() {
    if (this.inline) return this.#panel();
    const text = messages(this);
    const label = this.label || text.chooseMonths;
    const shown = this.#text();
    return html`<pl-popover label=${label} @pl-toggle=${this.#onToggle}>
      <pl-button
        slot="trigger"
        part="trigger"
        aria-label=${ifDefined(
          shown ? fill(text.labelValue, { label, value: shown }) : undefined,
        )}
        ?disabled=${this.#off}
        >${shown || this.placeholder || label}</pl-button
      >
      ${this.#panel()}
    </pl-popover>`;
  }
}

customElements.define("pl-month-range-picker", PlMonthRangePicker);

declare global {
  interface HTMLElementTagNameMap {
    "pl-month-range-picker": PlMonthRangePicker;
  }
}
