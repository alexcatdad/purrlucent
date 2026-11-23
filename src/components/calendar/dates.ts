/*
 * Calendar days as ISO strings (yyyy-mm-dd). All arithmetic runs in UTC, so a
 * daylight-saving change never moves a day, and every Intl formatter uses the
 * Gregorian calendar so the ISO value and what is shown agree.
 */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY = 86_400_000;

/** The ISO string of a UTC timestamp. */
const stamp = (time: number) => new Date(time).toISOString().slice(0, 10);

/** Milliseconds of an ISO day at UTC midnight, or undefined when it is not a real day. */
export function parseIso(value: string | null | undefined) {
  const m = ISO.exec(value ?? "");
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const time = Date.UTC(y, mo - 1, d);
  // Date.UTC rolls 2026-02-31 over to March; a real day reads back the same.
  return stamp(time) === value && y > 0 ? time : undefined;
}

export const isIso = (value: string | null | undefined): value is string =>
  parseIso(value) !== undefined;

export function toIso(year: number, month: number, day: number) {
  return stamp(Date.UTC(year, month - 1, day));
}

/** Today in the viewer's local time zone. */
export function today() {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export const addDays = (iso: string, days: number) =>
  stamp(parseIso(iso)! + days * DAY);

export const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Moves by whole months; a day past the end of the target month lands on its last day. */
export function addMonths(iso: string, months: number) {
  const date = new Date(parseIso(iso)!);
  const index = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return toIso(
    year,
    month,
    Math.min(date.getUTCDate(), daysInMonth(year, month)),
  );
}

/** 1 (Monday) to 7 (Sunday), as ISO 8601 and Intl.Locale's weekInfo count them. */
export const isoWeekday = (iso: string) =>
  new Date(parseIso(iso)!).getUTCDay() || 7;

export const clamp = (iso: string, min?: string, max?: string) =>
  min && iso < min ? min : max && iso > max ? max : iso;

type WeekInfoLocale = Intl.Locale & {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
};

/** The locale's first day of the week, 1 (Monday) to 7 (Sunday); Monday where the engine cannot say. */
export function firstDayOf(locale: string) {
  try {
    const info = new Intl.Locale(locale) as WeekInfoLocale;
    return (info.getWeekInfo?.() ?? info.weekInfo)?.firstDay ?? 1;
  } catch {
    return 1;
  }
}

/** A formatter for UTC days in the Gregorian calendar. */
export const dayFormat = (
  locale: string,
  options: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat(locale, {
    ...options,
    calendar: "gregory",
    timeZone: "UTC",
  });

/** The locale to use: the one asked for, else the closest lang, else the document's, else the browser's. */
export function localeOf(host: Element, asked?: string) {
  const locale =
    asked ||
    host.closest("[lang]")?.getAttribute("lang") ||
    document.documentElement.lang ||
    navigator.language ||
    "en";
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(locale)[0] ?? "en";
  } catch {
    return "en";
  }
}

/**
 * The order of day, month and year a locale writes, and its separator, from a
 * formatted sample. Digits stay Latin so typed text parses the same everywhere.
 */
function layout(locale: string) {
  const parts = dayFormat(locale, {
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(Date.UTC(2006, 10, 22));
  return {
    order: parts
      .filter(
        (p) => p.type === "day" || p.type === "month" || p.type === "year",
      )
      .map((p) => p.type as "day" | "month" | "year"),
    parts,
  };
}

/** An ISO day as the locale writes it, in its own digits, for the text field. */
export function formatDay(iso: string, locale: string) {
  return dayFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parseIso(iso)!);
}

/** The text with the locale's own digits written as Latin ones. */
function latinDigits(text: string, locale: string) {
  const numbers = new Intl.NumberFormat(locale, { useGrouping: false });
  const own = new Map(
    Array.from({ length: 10 }, (_, i) => [numbers.format(i), String(i)]),
  );
  return text.replace(/\p{Nd}/gu, (digit) => own.get(digit) ?? digit);
}

/** The day number of a cell as the locale writes it, without a suffix such as the Japanese 日. */
export const dayNumber = (iso: string, locale: string) =>
  dayFormat(locale, { day: "numeric" })
    .formatToParts(parseIso(iso)!)
    .find((part) => part.type === "day")!.value;

/**
 * Reads typed text as an ISO day: ISO itself, or three numbers in the order the
 * locale writes them (any separator). The year has four digits, so a date
 * half typed is not read as another one. Returns undefined when the text is not
 * a real day.
 */
export function parseTyped(text: string, locale: string) {
  const typed = latinDigits(text.trim(), locale);
  if (parseIso(typed) !== undefined) return typed;
  const numbers = typed.match(/\d+/g);
  if (!numbers || numbers.length !== 3 || /[^\d\s./\-,‎‏؜]/.test(typed))
    return undefined;
  const { order } = layout(locale);
  const at = (kind: "day" | "month" | "year") => numbers[order.indexOf(kind)]!;
  const [year, month, day] = [
    Number(at("year")),
    Number(at("month")),
    Number(at("day")),
  ];
  if (
    at("year").length !== 4 ||
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  )
    return undefined;
  return toIso(year, month, day);
}

/** True when a day is outside min and max or is one of the disabled days. */
export const unavailable = (
  iso: string,
  min: string | undefined,
  max: string | undefined,
  disabled: string[] | ((value: string) => boolean),
) =>
  (!!min && iso < min) ||
  (!!max && iso > max) ||
  (typeof disabled === "function" ? !!disabled(iso) : disabled.includes(iso));
