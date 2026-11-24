/*
 * The page language and the built-in text in it. The library ships English;
 * an app registers other languages with setMessages. Every component resolves
 * its words at render from the closest `lang`, crossing shadow roots, so a
 * component inside another one reads the language its host sits in. An
 * attribute on the component still wins over the built-in text.
 */

const en = {
  dismiss: "Dismiss",
  close: "Close",
  expand: "Expand",
  clear: "Clear",
  increase: "Increase",
  decrease: "Decrease",
  showOptions: "Show options",
  showOptionsFor: "{label}, show options",
  showItemsFor: "{label}, show items",
  noResults: "No results",
  sidebar: "Sidebar",
  sidebarFor: "{label} sidebar",
  breadcrumb: "Breadcrumb",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  chooseDate: "Choose date",
  invalidDate: "Enter a valid date.",
  unavailableDate: "Choose an available date.",
  carousel: "carousel",
  slide: "slide",
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  goToSlide: "Go to slide {page}",
  slideOf: "{page} of {total}",
  pagination: "Pagination",
  previousPage: "Previous page",
  nextPage: "Next page",
  messages: "Messages",
  message: "Message",
  scrollToLatest: "Scroll to latest",
  resize: "Resize",
  commands: "Commands",
  search: "Search",
  send: "Send",
  stop: "Stop",
  uploading: "Uploading",
  processing: "Processing",
  error: "Error",
  enterAll: "Enter all {count} characters.",
  checkRequired: "Check this box to continue.",
  switchRequired: "Turn this on to continue.",
  radioRequired: "Choose one of these options to continue.",
  selectRequired: "Choose an option to continue.",
  filter: "Filter",
  selectAll: "Select all",
  select: "Select",
  columns: "Columns",
  columnOptions: "Column options",
  rowOptions: "Row options",
  sortAscending: "Sort ascending",
  sortDescending: "Sort descending",
  hide: "Hide",
  moveEarlier: "Move earlier",
  moveLater: "Move later",
  pinStart: "Pin to start",
  pinEnd: "Pin to end",
  unpin: "Unpin",
  groupBy: "Group by",
  ungroup: "Ungroup",
  pinTop: "Pin to top",
  pinBottom: "Pin to bottom",
  unpinRow: "Unpin row",
};

export type PlMessages = typeof en;

const registered = new Map<string, PlMessages>();

/**
 * Registers the built-in text for a language, once at app start. Components
 * use it wherever the closest `lang` is that language: an exact tag such as
 * `sv-FI` first, else its language, `sv`. English is built in and is used for
 * any language without registered text. An attribute on a component still
 * wins over both.
 */
export function setMessages(lang: string, text: PlMessages) {
  // English fills any key a table leaves out, such as one added in a later version.
  registered.set(lang.toLowerCase(), { ...en, ...text });
}

/** The closest `lang` above an element, looking through the hosts of the shadow roots it sits in. */
function langOf(host: Element) {
  for (let node: Element | null = host; node;) {
    const lang = node.closest("[lang]")?.getAttribute("lang");
    if (lang) return lang;
    const root = node.getRootNode();
    node = root instanceof ShadowRoot ? root.host : null;
  }
  return "";
}

/** The locale to use: the one asked for, else the closest lang, else the document's, else the browser's. */
export function localeOf(host: Element, asked?: string) {
  const locale =
    asked ||
    langOf(host) ||
    document.documentElement.lang ||
    navigator.language ||
    "en";
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(locale)[0] ?? "en";
  } catch {
    return "en";
  }
}

/** The text registered for the element's language, or undefined when the app registered none. */
export function ownMessages(host: Element) {
  const locale = localeOf(host);
  return (
    registered.get(locale.toLowerCase()) ??
    registered.get(new Intl.Locale(locale).language)
  );
}

/** The built-in text in the element's language, else English. */
export const messages = (host: Element) => ownMessages(host) ?? en;

/** Fills `{name}` slots in a message. */
export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (slot, name: string) =>
    name in values ? String(values[name]) : slot,
  );
