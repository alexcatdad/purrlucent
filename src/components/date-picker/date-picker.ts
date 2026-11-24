import { LitElement, html, nothing, svg } from "lit";
import type { PropertyValues } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { AriaWatch, forwardAria } from "../../behaviors/aria-forward.ts";
import {
  fieldMessage,
  syncFieldMessage,
} from "../../behaviors/field-message.ts";
import { submitImplicitly } from "../../behaviors/implicit-submit.ts";
import { labelText } from "../../behaviors/labels.ts";
import { fireNative } from "../../behaviors/native-events.ts";
import "../button/button.ts";
import "../calendar/calendar.ts";
import type { PlCalendarDisabledDates } from "../calendar/calendar.ts";
import {
  formatDay,
  isIso,
  parseTyped,
  unavailable,
} from "../calendar/dates.ts";
import "../popover/popover.ts";
import type { PlPopover } from "../popover/popover.ts";
import { datePickerStyles } from "./date-picker.css.ts";
import { localeOf, messages } from "../../behaviors/locale.ts";

const calendarGlyph = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /></svg>`;

/**
 * A field for one day. The text entry takes the day as the locale writes it
 * (`11/22/2026`, `22.11.2026`) or as an ISO day (`2026-11-22`); the button
 * beside it opens a `pl-calendar` in a popover, and choosing a day there fills
 * the field, closes the popover and returns focus to the button. The slotted
 * text is a visible label; without it, `label` becomes the entry's accessible
 * name, and without both a native `<label for>` names it. The `value` is the
 * ISO day, `yyyy-mm-dd`, or empty while the text is not a day that can be
 * chosen. It takes part in forms like a native input: it submits `name` with
 * its value, a reset returns it to its `value` attribute, a disabled fieldset
 * disables it, and a day that is not real, or is outside `min` and `max` or one
 * of the disabled days, makes the form invalid. Alt and Down Arrow in the entry
 * open the calendar.
 *
 * @attr {string} value - The starting day, `yyyy-mm-dd`. The `value` property holds the current one.
 * @attr {string} label - The accessible name when there is no slotted label.
 * @attr {string} size - `md` (default), `lg` or `xl`.
 * @attr {string} name - The name submitted with a form.
 * @attr {string} placeholder - Hint shown while the entry is empty, for example the format the locale expects.
 * @attr {string} min - The earliest day that can be chosen, `yyyy-mm-dd`.
 * @attr {string} max - The latest day that can be chosen, `yyyy-mm-dd`.
 * @attr {string} disabled-dates - Days that cannot be chosen, as ISO days separated by commas or spaces. The `disabledDates` property also takes a function from an ISO day to a boolean.
 * @attr {string} locale - A BCP 47 tag for the day format, names and first weekday. Defaults to the closest `lang`, else the document's, else the browser's.
 * @attr {number} first-day - The calendar's first day of the week, 1 (Monday) to 7 (Sunday). Defaults to the locale's.
 * @attr {boolean} required - The form is invalid while the field is empty.
 * @attr {boolean} readonly - The text can be selected but not edited and the calendar does not open.
 * @attr {boolean} disabled - No focus, nothing submitted.
 * @attr {string} calendar-label - The calendar button's and the popover's accessible name. Defaults to the page language's text (see `setMessages`), in English "Choose date".
 * @attr {string} invalid-message - The message for text that is not a day. Defaults to the page language's text (see `setMessages`), in English "Enter a valid date."
 * @attr {string} range-message - The message for a day outside `min` and `max` or one of the disabled days. Defaults to the page language's text (see `setMessages`), in English "Choose an available date."
 * @slot - The visible label.
 * @csspart label - The visible label.
 * @csspart field - The shell around the entry and the button.
 * @csspart control - The native text entry.
 * @csspart trigger - The button that opens the calendar.
 * @csspart calendar - The calendar in the popover.
 * @csspart message - The icon and validation message below the field while it is invalid.
 * @fires {CustomEvent<{ value: string }>} pl-input - The value changed through typing or the calendar. `detail.value` holds the ISO day, or an empty string while the text is not a day that can be chosen.
 * @fires {CustomEvent<{ value: string }>} pl-change - The value was committed (blur or Enter after typing, or a day chosen in the calendar). `detail.value` holds it.
 * @fires input - After each edit, as a native input fires it.
 * @fires change - After each pl-change, as a native input fires it.
 */
export class PlDatePicker extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = datePickerStyles;
  static override properties = {
    value: {},
    label: {},
    size: { reflect: true },
    name: { reflect: true },
    placeholder: {},
    min: { reflect: true },
    max: { reflect: true },
    disabledDates: {
      attribute: "disabled-dates",
      converter: {
        fromAttribute: (text: string | null) =>
          (text ?? "").split(/[\s,]+/).filter(isIso),
      },
    },
    locale: { reflect: true },
    firstDay: { attribute: "first-day", type: Number },
    required: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    calendarLabel: { attribute: "calendar-label" },
    invalidMessage: { attribute: "invalid-message" },
    rangeMessage: { attribute: "range-message" },
    _text: { state: true },
    _labelled: { state: true },
  };

  declare value: string;
  declare label: string | undefined;
  declare size: "md" | "lg" | "xl";
  declare name: string;
  declare placeholder: string | undefined;
  declare min: string | undefined;
  declare max: string | undefined;
  declare disabledDates: PlCalendarDisabledDates;
  declare locale: string | undefined;
  declare firstDay: number | undefined;
  declare required: boolean;
  declare readonly: boolean;
  declare disabled: boolean;
  declare calendarLabel: string;
  declare invalidMessage: string;
  declare rangeMessage: string;
  /** What the entry shows. It follows `value`, except while the typed text is not a day. */
  declare _text: string;
  declare _labelled: boolean;

  readonly #internals = this.attachInternals();
  readonly #labelWatch = new MutationObserver(() => this.#syncLabelled());
  readonly #ariaWatch = new AriaWatch(this, () => this.#sync());
  #touched = false;
  #typing = false;
  /** The value last reported with pl-change. */
  #committed = "";
  #custom = "";

  constructor() {
    super();
    this.addEventListener("invalid", () => {
      this.#touched = true;
      this.#sync();
    });
    this.addEventListener("focusin", () => this.requestUpdate());
    this.value = "";
    this.size = "md";
    this.name = "";
    this.disabledDates = [];
    this.required = false;
    this.readonly = false;
    this.disabled = false;
    this.calendarLabel = "";
    this.invalidMessage = "";
    this.rangeMessage = "";
    this._text = "";
    this._labelled = false;
  }

  get #input() {
    return this.renderRoot?.querySelector<HTMLInputElement>("input");
  }

  get #popover() {
    return this.renderRoot?.querySelector<PlPopover>("pl-popover");
  }

  get #locale() {
    return localeOf(this, this.locale);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#labelWatch.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.#ariaWatch.observe();
    this.#syncLabelled();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#labelWatch.disconnect();
    this.#ariaWatch.disconnect();
  }

  get form() {
    return this.#internals.form;
  }

  get labels() {
    return this.#internals.labels;
  }

  get validity() {
    return this.#internals.validity;
  }

  get validationMessage() {
    return this.#internals.validationMessage;
  }

  get willValidate() {
    return this.#internals.willValidate;
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  setCustomValidity(message: string) {
    this.#custom = message;
    this.#sync();
  }

  formResetCallback() {
    this.#touched = false;
    this.#typing = false;
    this.value = this.getAttribute("value") ?? "";
    this.#showValue();
    this.requestUpdate();
  }

  formDisabledCallback() {
    this.requestUpdate();
  }

  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  /** The ISO day a text reads as, or undefined. */
  #parse(text: string) {
    return text.trim() ? parseTyped(text, this.#locale) : undefined;
  }

  #off(iso: string) {
    return unavailable(iso, this.min, this.max, this.disabledDates);
  }

  /** The value a text stands for: its day when that can be chosen, else empty. */
  #read(text: string) {
    const parsed = this.#parse(text);
    return parsed && !this.#off(parsed) ? parsed : "";
  }

  /** Writes the value into the entry in the locale's format. */
  #showValue() {
    this._text = isIso(this.value) ? formatDay(this.value, this.#locale) : "";
  }

  /** The locale the entry's day is written in. */
  #shownIn = "";

  protected override willUpdate(changed: PropertyValues<this>) {
    // The language changed: write the day again in its format, unless the
    // person is typing.
    const locale = this.#locale;
    if (locale !== this.#shownIn && !this.#typing) {
      this.#shownIn = locale;
      if (isIso(this.value)) this.#showValue();
    }
    if (!changed.has("value")) return;
    if (!isIso(this.value)) this.value = "";
    // A script or a reset set it: the entry follows, unless it already reads as this day.
    if (this.value !== this.#read(this._text)) this.#showValue();
    if (!this.#typing) this.#committed = this.value;
  }

  protected override updated() {
    this.#setState("labelled", this._labelled);
    this.#sync();
  }

  #setState(name: string, on: boolean) {
    if (on) this.#internals.states.add(name);
    else this.#internals.states.delete(name);
  }

  #sync() {
    const input = this.#input;
    if (!input) return;
    const text = input.value.trim();
    const parsed = this.#parse(text);
    const message = !text
      ? ""
      : !parsed
        ? this.invalidMessage || messages(this).invalidDate
        : this.#off(parsed)
          ? this.rangeMessage || messages(this).unavailableDate
          : "";
    input.setCustomValidity(this.#custom || message);
    const invalid = this.#touched && !input.validity.valid;
    this.#internals.setFormValue(this.value || null);
    this.#internals.setValidity(input.validity, input.validationMessage, input);
    this.#setState("user-invalid", invalid);
    if (invalid) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    forwardAria(this, input);
    syncFieldMessage(this.renderRoot as ShadowRoot, input, invalid);
  }

  #emit(name: "pl-input" | "pl-change") {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Reports a committed value, once. */
  #commit() {
    this.#typing = false;
    if (this.value === this.#committed) return;
    this.#committed = this.value;
    this.#emit("pl-change");
    fireNative(this, "change");
  }

  // The native input event of the entry already crosses the shadow root.
  #onInput = (event: Event) => {
    this.#typing = true;
    this._text = (event.target as HTMLInputElement).value;
    this.value = this.#read(this._text);
    this.#sync();
    this.#emit("pl-input");
  };

  #onChange = () => {
    this.#touched = true;
    const parsed = this.#parse(this._text);
    if (parsed && !this.#off(parsed)) this.#showValue();
    this.#sync();
    this.#commit();
  };

  #onBlur = () => {
    this.#touched = true;
    this.#sync();
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (event.isComposing || event.defaultPrevented) return;
    if (event.key === "Enter") submitImplicitly(this.#internals.form, event);
    else if (event.key === "ArrowDown" && event.altKey && !this.readonly) {
      event.preventDefault();
      this.#popover?.show();
    }
  };

  #onPick = (event: CustomEvent<{ value: string }>) => {
    // The calendar's own events stay inside; the field reports its own.
    event.stopPropagation();
    this.#popover!.hide();
    this.#touched = true;
    this.value = event.detail.value;
    this.#showValue();
    this.#emit("pl-input");
    fireNative(this, "input");
    this.#commit();
  };

  #onToggle = (event: CustomEvent<{ open: boolean }>) => {
    event.stopPropagation();
    if (event.detail.open)
      void this.renderRoot.querySelector("pl-calendar")?.focusDay();
  };

  // Watches the light DOM: editing a slotted label's text fires no slotchange.
  #syncLabelled() {
    this._labelled = !!this.textContent?.trim();
  }

  override render() {
    const off = this.matches(":disabled");
    return html`<label part="label" for="control"><slot></slot></label>
      <div part="field">
        <input
          id="control"
          part="control"
          type="text"
          .value=${this._text}
          aria-label=${
            this._labelled
              ? nothing
              : ifDefined(this.label || labelText(this.labels))
          }
          placeholder=${ifDefined(this.placeholder)}
          autocomplete="off"
          ?required=${this.required}
          ?readonly=${this.readonly}
          ?disabled=${off}
          @input=${this.#onInput}
          @change=${this.#onChange}
          @blur=${this.#onBlur}
          @keydown=${this.#onKeydown}
        />
        <pl-popover
          label=${this.calendarLabel || messages(this).chooseDate}
          @pl-toggle=${this.#onToggle}
        >
          <pl-button
            slot="trigger"
            part="trigger"
            icon
            variant="ghost"
            size=${this.size}
            aria-label=${this.calendarLabel || messages(this).chooseDate}
            ?disabled=${off || this.readonly}
          >
            ${calendarGlyph}
          </pl-button>
          <pl-calendar
            part="calendar"
            .value=${this.value}
            min=${ifDefined(this.min)}
            max=${ifDefined(this.max)}
            .disabledDates=${this.disabledDates}
            locale=${this.#locale}
            first-day=${ifDefined(this.firstDay)}
            @pl-change=${this.#onPick}
            @input=${(event: Event) => event.stopPropagation()}
            @change=${(event: Event) => event.stopPropagation()}
          ></pl-calendar>
        </pl-popover>
      </div>
      ${fieldMessage}`;
  }
}

customElements.define("pl-date-picker", PlDatePicker);

declare global {
  interface HTMLElementTagNameMap {
    "pl-date-picker": PlDatePicker;
  }
}
