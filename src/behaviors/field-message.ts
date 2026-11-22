import { html } from "lit";
import { errorGlyph } from "./glyphs.ts";

/** The message below a text field; the field's `#sync` fills it in. */
export const fieldMessage = html`<div part="message" id="message">
  ${errorGlyph}<span></span>
</div>`;

/**
 * Shows the control's own validation message while the field is user-invalid
 * and links it to the control, so it is announced with the field.
 */
export function syncFieldMessage(
  root: ShadowRoot,
  control: HTMLInputElement | HTMLTextAreaElement,
  invalid: boolean,
) {
  root.querySelector("[part=message] span")!.textContent = invalid
    ? control.validationMessage
    : "";
  if (invalid) control.setAttribute("aria-describedby", "message");
  else control.removeAttribute("aria-describedby");
}
