const textFields =
  "purr-input, purr-number-field, purr-combobox, input:is(:not([type]), [type=text], [type=search], [type=email], [type=url], [type=tel], [type=password], [type=number])";

/**
 * Native implicit submission: press the form's default button, or submit
 * when the field that was entered is the only one that could. The Enter that
 * submitted is consumed, so a dialog around the form does not act on it too.
 */
export function submitImplicitly(form: HTMLFormElement | null, event: Event) {
  if (!form) return;
  event.preventDefault();
  const button = [...form.elements].find(
    (el) => (el as HTMLButtonElement).type === "submit",
  ) as HTMLElement | undefined;
  if (button) {
    if (!button.matches(":disabled")) button.click();
  } else if (form.querySelectorAll(textFields).length <= 1) {
    form.requestSubmit();
  }
}
