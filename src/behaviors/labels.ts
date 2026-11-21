/**
 * A native `<label for>` points at the host, but the control that is focused
 * and read out sits in the shadow root. A reflected reference may point out of
 * a shadow root, so the control takes its name from those labels, unless the
 * host already names it with a slotted label or `label`.
 */
export const nameFromLabels = (
  control: Element | null | undefined,
  labels: NodeList,
  named: boolean,
) => {
  if (control)
    control.ariaLabelledByElements =
      named || !labels.length ? null : ([...labels] as Element[]);
};
