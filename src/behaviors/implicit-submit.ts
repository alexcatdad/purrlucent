export const textFields =
  "pl-input, pl-number-field, pl-combobox, input:is(:not([type]), [type=text], [type=search], [type=email], [type=url], [type=tel], [type=password], [type=number])";

/** The default action of the pl-dialog around the element, through shadow roots; a destructive one is not a default. */
function dialogDefault(el: Element): HTMLElement | null {
  for (
    let node: Node | null = el;
    node;
    node = node.parentNode ?? (node as ShadowRoot).host
  ) {
    if (node instanceof Element && node.localName === "pl-dialog")
      return node.querySelector<HTMLElement>(
        ":scope > [slot=actions][default]:not([destructive])",
      );
  }
  return null;
}

/**
 * Native implicit submission: press the form's default button, or submit
 * when the field that was entered is the only one that could. A form without
 * a submit button and with several text fields, inside a pl-dialog, presses
 * the dialog's default action instead. The Enter that submitted is consumed,
 * so a dialog around the form does not act on it too.
 */
export function submitImplicitly(form: HTMLFormElement | null, event: Event) {
  if (!form) return;
  event.preventDefault();
  const button = [...form.elements].find(
    (el) => (el as HTMLButtonElement).type === "submit",
  ) as HTMLElement | undefined;
  if (button) {
    if (!button.matches(":disabled")) button.click();
    return;
  }
  if (form.querySelectorAll(textFields).length <= 1) {
    form.requestSubmit();
    return;
  }
  const action = dialogDefault(form);
  if (action && !action.matches(":disabled")) action.click();
}
