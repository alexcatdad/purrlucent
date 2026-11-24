import { LitElement, html, nothing, svg } from "lit";
import type { PropertyValues } from "lit";
import { backGlyph } from "../../behaviors/glyphs.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import { calendarStyles } from "./calendar.css.ts";
import {
  addDays,
  addMonths,
  clamp,
  dayFormat,
  dayNumber,
  daysInMonth,
  firstDayOf,
  isIso,
  isoWeekday,
  parseIso,
  toIso,
  today,
  unavailable,
} from "./dates.ts";
import { localeOf, messages } from "../../behaviors/locale.ts";

/** Days the calendar cannot select: a list of ISO days, or a function that says whether an ISO day is off. */
export type PlCalendarDisabledDates = string[] | ((value: string) => boolean);

const forwardGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6 6.5-6 6.5" /></svg>`;

// Monday 2 January 2023: a reference week to name the weekdays from.
const MONDAY = "2023-01-02";

/**
 * A month calendar for choosing one day, as the WAI-ARIA date grid: the days
 * are a `grid` with one tab stop, and the arrow keys, Home, End, Page Up and
 * Page Down move through them (Shift with Page Up or Down moves a year), Enter
 * or Space selects. Buttons above the grid show the previous and next month.
 * The value is an ISO day, `yyyy-mm-dd`. Month and weekday names, the first day
 * of the week and the writing direction follow the locale. It takes part in
 * forms like a native input: it submits `name` with its value and a reset
 * returns it to its `value` attribute.
 *
 * @attr {string} value - The selected day, `yyyy-mm-dd`, or empty. The `value` property holds the current one.
 * @attr {string} min - The earliest day that can be selected, `yyyy-mm-dd`.
 * @attr {string} max - The latest day that can be selected, `yyyy-mm-dd`.
 * @attr {string} disabled-dates - Days that cannot be selected, as ISO days separated by commas or spaces. The `disabledDates` property also takes a function from an ISO day to a boolean.
 * @attr {string} locale - A BCP 47 tag for names, the first weekday and the direction of the numbers. Defaults to the closest `lang`, else the document's, else the browser's.
 * @attr {number} first-day - The first day of the week, 1 (Monday) to 7 (Sunday). Defaults to the locale's.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} prev-label - The previous month button's accessible name. Defaults to the page language's text (see `setMessages`), in English "Previous month".
 * @attr {string} next-label - The next month button's accessible name. Defaults to the page language's text (see `setMessages`), in English "Next month".
 * @csspart header - The row with the month buttons and the title.
 * @csspart title - The month and year.
 * @csspart nav - A month button.
 * @csspart grid - The table of days.
 * @csspart weekday - A weekday heading.
 * @csspart day - A day cell.
 * @fires {CustomEvent<{ value: string }>} pl-change - A day was selected. `detail.value` holds it. Selecting the day that is already selected fires nothing.
 * @fires input - After each pl-change, as a native input fires it.
 * @fires change - After each pl-change, as a native input fires it.
 */
export class PlCalendar extends LitElement {
  static formAssociated = true;
  static override styles = calendarStyles;
  static override properties = {
    value: {},
    min: { reflect: true },
    max: { reflect: true },
    locale: { reflect: true },
    firstDay: { attribute: "first-day", type: Number },
    name: { reflect: true },
    disabledDates: {
      attribute: "disabled-dates",
      converter: {
        fromAttribute: (text: string | null) =>
          (text ?? "").split(/[\s,]+/).filter(isIso),
      },
    },
    prevLabel: { attribute: "prev-label" },
    nextLabel: { attribute: "next-label" },
    _focus: { state: true },
  };

  declare value: string;
  declare min: string | undefined;
  declare max: string | undefined;
  declare locale: string | undefined;
  declare firstDay: number | undefined;
  declare name: string;
  declare disabledDates: PlCalendarDisabledDates;
  declare prevLabel: string;
  declare nextLabel: string;
  /** The day that holds the tab stop, and with it the month on show. Empty until a day is chosen or focused. */
  declare _focus: string;

  readonly #internals = this.attachInternals();

  constructor() {
    super();
    this.value = "";
    this.name = "";
    this.disabledDates = [];
    this.prevLabel = "";
    this.nextLabel = "";
    this._focus = "";
  }

  get form() {
    return this.#internals.form;
  }

  formResetCallback() {
    this.value = this.getAttribute("value") ?? "";
  }

  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  /** Moves focus to the day that holds the tab stop: the selected day, or today. */
  async focusDay() {
    await this.updateComplete;
    this.renderRoot
      .querySelector<HTMLElement>('[part="day"][tabindex="0"]')
      ?.focus();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has("value") && isIso(this.value)) this._focus = this.value;
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has("value"))
      this.#internals.setFormValue(isIso(this.value) ? this.value : null);
  }

  get #locale() {
    return localeOf(this, this.locale);
  }

  get #firstDay() {
    const asked = Math.trunc(this.firstDay ?? 0);
    return asked >= 1 && asked <= 7 ? asked : firstDayOf(this.#locale);
  }

  get #min() {
    return isIso(this.min) ? this.min : undefined;
  }

  get #max() {
    return isIso(this.max) ? this.max : undefined;
  }

  /** The day with the tab stop: the one last chosen or moved to, else the value, else today, kept inside min and max. */
  get #focusDay() {
    const start = isIso(this._focus)
      ? this._focus
      : isIso(this.value)
        ? this.value
        : today();
    return clamp(start, this.#min, this.#max);
  }

  #off(iso: string) {
    return unavailable(iso, this.#min, this.#max, this.disabledDates);
  }

  #select(iso: string) {
    if (this.#off(iso)) return;
    this._focus = iso;
    if (iso === this.value) return;
    this.value = iso;
    this.dispatchEvent(
      new CustomEvent("pl-change", {
        detail: { value: iso },
        bubbles: true,
        composed: true,
      }),
    );
    fireNative(this, "input", "change");
  }

  async #moveTo(to: string) {
    if (!isIso(to)) return;
    this._focus = clamp(to, this.#min, this.#max);
    await this.updateComplete;
    this.renderRoot
      .querySelector<HTMLElement>('[part="day"][tabindex="0"]')
      ?.focus();
  }

  #shift(months: number) {
    if (this.#navOff(months)) return;
    this._focus = clamp(
      addMonths(this.#focusDay, months),
      this.#min,
      this.#max,
    );
  }

  /** A month button is off when no day of the month it leads to can be reached. */
  #navOff(months: number) {
    const [y, m] = this.#focusDay.split("-").map(Number) as [number, number];
    return months < 0
      ? !!this.#min && this.#min >= toIso(y, m, 1)
      : !!this.#max && this.#max <= toIso(y, m, daysInMonth(y, m));
  }

  #onKeydown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const from = (event.target as HTMLElement)
      .closest<HTMLElement>("[data-date]")
      ?.getAttribute("data-date");
    if (!from) return;
    const rtl = this.matches(":dir(rtl)");
    // Days since the first day of the week.
    const into = (isoWeekday(from) - this.#firstDay + 7) % 7;
    const steps: Record<string, string> = {
      ArrowLeft: addDays(from, rtl ? 1 : -1),
      ArrowRight: addDays(from, rtl ? -1 : 1),
      ArrowUp: addDays(from, -7),
      ArrowDown: addDays(from, 7),
      Home: addDays(from, -into),
      End: addDays(from, 6 - into),
      PageUp: addMonths(from, event.shiftKey ? -12 : -1),
      PageDown: addMonths(from, event.shiftKey ? 12 : 1),
    };
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.#select(from);
    } else if (steps[event.key]) {
      event.preventDefault();
      void this.#moveTo(steps[event.key]!);
    }
  };

  override render() {
    const locale = this.#locale;
    const focus = this.#focusDay;
    const [year, month] = focus.split("-").map(Number) as [number, number];
    const length = daysInMonth(year, month);
    const firstDay = this.#firstDay;
    const lead = (isoWeekday(toIso(year, month, 1)) - firstDay + 7) % 7;
    const rows = Math.ceil((lead + length) / 7);
    const title = dayFormat(locale, { month: "long", year: "numeric" }).format(
      parseIso(focus)!,
    );
    const week = Array.from({ length: 7 }, (_, i) =>
      parseIso(addDays(MONDAY, i))!,
    );
    // Short names where they tell the days apart, else the narrow ones.
    const short = dayFormat(locale, { weekday: "short" });
    const names = dayFormat(locale, {
      weekday:
        new Set(week.map((time) => short.format(time))).size === 7
          ? "short"
          : "narrow",
    });
    const long = dayFormat(locale, { weekday: "long" });
    const full = dayFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const now = today();
    const selected = isIso(this.value) ? this.value : "";

    const cell = (day: number) => {
      const iso = toIso(year, month, day);
      const off = this.#off(iso);
      return html`<td
        part="day"
        role="gridcell"
        data-date=${iso}
        tabindex=${iso === focus ? 0 : -1}
        aria-selected=${iso === selected ? "true" : "false"}
        aria-disabled=${off ? "true" : nothing}
        aria-current=${iso === now ? "date" : nothing}
        aria-label=${full.format(parseIso(iso)!)}
        @click=${() => this.#select(iso)}
      >
        ${dayNumber(iso, locale)}
      </td>`;
    };

    return html`<div part="header">
        <button
          part="nav"
          type="button"
          aria-label=${this.prevLabel || messages(this).previousMonth}
          aria-disabled=${this.#navOff(-1) ? "true" : nothing}
          @click=${() => this.#shift(-1)}
        >
          ${backGlyph}
        </button>
        <div part="title" id="title" aria-live="polite">${title}</div>
        <button
          part="nav"
          type="button"
          aria-label=${this.nextLabel || messages(this).nextMonth}
          aria-disabled=${this.#navOff(1) ? "true" : nothing}
          @click=${() => this.#shift(1)}
        >
          ${forwardGlyph}
        </button>
      </div>
      <table
        part="grid"
        role="grid"
        aria-labelledby="title"
        @keydown=${this.#onKeydown}
      >
        <thead>
          <tr>
            ${Array.from({ length: 7 }, (_, i) => {
              const weekday = addDays(MONDAY, (firstDay - 1 + i) % 7);
              return html`<th part="weekday" scope="col">
                <abbr title=${long.format(parseIso(weekday)!)}
                  >${names.format(parseIso(weekday)!)}</abbr
                >
              </th>`;
            })}
          </tr>
        </thead>
        <tbody>
          ${Array.from(
            { length: rows },
            (_, row) =>
              html`<tr>
                ${Array.from({ length: 7 }, (_, col) => {
                  const day = row * 7 + col - lead + 1;
                  return day < 1 || day > length
                    ? html`<td role="presentation"></td>`
                    : cell(day);
                })}
              </tr>`,
          )}
        </tbody>
      </table>`;
  }
}

customElements.define("pl-calendar", PlCalendar);

declare global {
  interface HTMLElementTagNameMap {
    "pl-calendar": PlCalendar;
  }
}
