/** The host attributes a text control forwards to its inner native control. */
export const FORWARDED_ARIA = [
  "aria-required",
  "aria-invalid",
  "aria-describedby",
  "aria-errormessage",
];

const text = (el: Element | null) =>
  el?.textContent?.replace(/\s+/g, " ").trim() ?? "";

const REFERENCES = ["aria-describedby", "aria-errormessage"];

/** The elements an ID reference list names, looked up beside the host. */
function elements(host: HTMLElement, name: string) {
  const root = host.getRootNode() as Document | ShadowRoot;
  return (host.getAttribute(name) ?? "")
    .split(/\s+/)
    .map((id) => (id ? root.getElementById?.(id) : null))
    .filter((el): el is HTMLElement => !!el);
}

/** The text of the elements an ID reference list names. */
const referenced = (host: HTMLElement, name: string) =>
  elements(host, name).map(text).filter(Boolean);

/**
 * Calls `onChange` when the host's forwarded attributes change, or the text or
 * ID of an element they reference does.
 */
export class AriaWatch {
  readonly #host: HTMLElement;
  readonly #observer: MutationObserver;
  #active = false;

  constructor(host: HTMLElement, onChange: () => void) {
    this.#host = host;
    this.#observer = new MutationObserver(() => {
      this.#watch();
      onChange();
    });
  }

  observe() {
    this.#active = true;
    this.#watch();
  }

  disconnect() {
    this.#active = false;
    this.#observer.disconnect();
  }

  #watch() {
    if (!this.#active) return;
    const host = this.#host;
    this.#observer.disconnect();
    this.#observer.observe(host, { attributeFilter: FORWARDED_ARIA });
    const names = REFERENCES.filter((name) => host.hasAttribute(name));
    if (!names.length) return;
    for (const name of names)
      for (const el of elements(host, name))
        this.#observer.observe(el, {
          childList: true,
          subtree: true,
          characterData: true,
        });
    // A referenced ID may be added to, or moved onto, another element.
    this.#observer.observe(host.getRootNode(), {
      attributeFilter: ["id"],
      subtree: true,
    });
  }
}

/** `aria-description` this behavior wrote, so an author's or a field's own is left alone. */
const wrote = new WeakMap<Element, string>();

/**
 * Forwards the host's `aria-required`, `aria-invalid`, `aria-describedby` and
 * `aria-errormessage` to the native control in its shadow root, where an ID
 * reference on the host cannot resolve. The referenced text is copied to the
 * control's `aria-description`, the error message only while the host is
 * `aria-invalid`. Returns whether the host marks itself invalid.
 */
export function forwardAria(host: HTMLElement, control: HTMLElement) {
  const required = host.getAttribute("aria-required");
  if (required === "true") control.setAttribute("aria-required", "true");
  else control.removeAttribute("aria-required");

  const flag = host.getAttribute("aria-invalid");
  const invalid = !!flag && flag !== "false";
  if (invalid)
    control.setAttribute("aria-invalid", flag === "" ? "true" : flag);

  const description = [
    ...referenced(host, "aria-describedby"),
    ...(invalid ? referenced(host, "aria-errormessage") : []),
  ].join(" ");
  const mine = wrote.get(control);
  const now = control.getAttribute("aria-description");
  if (description) {
    if (now === null || now === mine) {
      control.setAttribute("aria-description", description);
      wrote.set(control, description);
    }
  } else if (mine !== undefined && now === mine) {
    control.removeAttribute("aria-description");
    wrote.delete(control);
  }
  return invalid;
}
