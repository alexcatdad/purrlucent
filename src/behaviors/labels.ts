// The parts of an accessible name a label commonly holds: text, an image's
// alt, an element's aria-label, minus anything hidden from assistive tech.
const nameOf = (node: Node): string => {
  if (!(node instanceof Element))
    return node.nodeType === Node.TEXT_NODE ? (node.textContent ?? "") : "";
  if (node.getAttribute("aria-hidden") === "true") return "";
  return (
    node.getAttribute("aria-label") ??
    (node instanceof HTMLImageElement
      ? node.alt
      : [...node.childNodes].map(nameOf).join(""))
  );
};

/**
 * A native `<label for>` points at the host, but the control that is focused
 * and read out sits in the shadow root, out of the label's reach. The label's
 * name becomes the control's name instead.
 */
export const labelText = (labels: NodeList) =>
  [...labels]
    .map((label) => nameOf(label).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ") || undefined;
