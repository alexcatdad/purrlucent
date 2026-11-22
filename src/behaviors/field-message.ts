import { html } from "lit";
import { errorGlyph } from "./glyphs.ts";

/** The message below a text field; the field's `#sync` fills it in. */
export const fieldMessage = html`<div part="message" id="message">
  ${errorGlyph}<span></span>
</div>`;

/**
 * Shows the validation message, the control's own by default, while the field
 * is user-invalid and links it to the control, so it is announced with the field.
 */
export function syncFieldMessage(
  root: ShadowRoot,
  control: HTMLInputElement | HTMLTextAreaElement,
  invalid: boolean,
  message = control.validationMessage,
) {
  root.querySelector("[part=message] span")!.textContent = invalid
    ? message
    : "";
  if (invalid) control.setAttribute("aria-describedby", "message");
  else control.removeAttribute("aria-describedby");
}
