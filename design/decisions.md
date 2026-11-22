# Design decisions

Decisions that apply across components, made after the per-component HIG audits in `design/audits/`. `src/tokens/tokens.css` stays the source of truth for values.

## 2026-11-22

1. **Label weight: Regular (400).** Control labels (buttons, checkbox, switch, radio, segmented control, fields, select, combobox, menu items) use Regular, as HIG's macOS Body style does (13pt Regular, emphasized weight Semibold). Semibold stays for emphasis, such as a selected segment or a heading.
2. **Visible labels on select and combobox: a named `label` slot.** `slot="label"` shows a visible label that also names the control. The `label` attribute stays for an accessible name without visible text, and an external `<label for>` names the control too, as with `purr-input`.
3. **Dialog default and cancel buttons: explicit roles.** `purr-button` gets `default` and `cancel` attributes. In a dialog, Return activates the default button (not from a multi-line text area), and Escape or Command-Period activates the cancel button. The default button draws as primary. A destructive button cannot be the default; the dialog warns.
4. **Hit size with a fine pointer: 24px, kept and documented.** This is above HIG's macOS minimum control size (20×20pt) and equals WCAG 2.2 AA's target minimum. A coarse pointer keeps 44px, HIG's iOS default control size.
5. **No state shown by color alone.**
   - An invalid text field (input, textarea, number field) shows its validation message below the field, with an icon, linked through `aria-describedby`. The message defaults to the native one and can be overridden.
   - A selected toggle button gets a filled face, like a selected segment.
   - Each banner tone draws its own default icon (info, warning, error) unless one is slotted.
6. **Built-in strings: native messages plus attributes.** Validation uses the browser's localized message where a native input exists to borrow it from. Every other built-in string gets an attribute (for example `empty-label`, `toggle-label`), as `close-label` already works on the banner. There is no global string table.
