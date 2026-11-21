/**
 * A native `<label for>` points at the host, but the control that is focused
 * and read out sits in the shadow root, out of the label's reach. Its text
 * becomes the control's name instead.
 */
export const labelText = (labels: NodeList) =>
  [...labels]
    .map((label) => label.textContent?.trim())
    .filter(Boolean)
    .join(" ") || undefined;
