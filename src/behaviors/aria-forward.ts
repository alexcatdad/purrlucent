/** The host attributes a text control forwards to its inner native control. */
export const FORWARDED_ARIA = [
  "aria-required",
  "aria-invalid",
  "aria-describedby",
  "aria-errormessage",
];

const text = (el: Element | null) =>
  el?.textContent?.replace(/\s+/g, " ").trim() ?? "";

/** The text of the elements an ID reference list names, looked up beside the host. */
function referenced(host: HTMLElement, name: string) {
  const root = host.getRootNode() as Document | ShadowRoot;
  return (host.getAttribute(name) ?? "")
    .split(/\s+/)
    .map((id) => (id ? text(root.getElementById?.(id) ?? null) : ""))
    .filter(Boolean);
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
