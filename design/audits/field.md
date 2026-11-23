# HIG audit: field and fieldset

Source: [HIG Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data) and [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields). The Entering data page could not be fetched as text on 2026-11-23, so its rows below are the guidance as the library understands it and need a check against the page. Code: `src/components/field/`, `hig/rules/entering-data.yaml`.

The HIG has no field or form-row component. `pl-field` is the nearest form: a label, a control, help text and an error laid out the way a settings row or a form is on Apple platforms. `pl-fieldset` is the nearest form of a titled group of rows. It names a control that has no label of its own; `pl-input`, `pl-textarea` and the other `pl-` text controls keep their own label slot.

Verdicts: **met**, **gap**, **deviation**, or **needs eyes**.

## Library guidelines

| Guideline (shortened)                                        | Verdict    | Evidence                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every field has a visible label that names it.               | met        | The label is slotted and names the control by `aria-labelledby`, `<label for>` or the control's `label`. Test: "a pl-input is named by the label and described by the description".                                                                              |
| Help text is tied to the field it describes.                 | met        | The description is the control's `aria-describedby`, or its inner control's `aria-description` for a `pl-` text control. Same test.                                                                                                                              |
| A bad value shows a message beside the field and marks it.   | met        | `invalid` shows the `error` slot with an icon, sets `aria-invalid`, and for role controls `aria-errormessage`. Tests: "the error shows and marks the control only while the field is invalid", "an invalid checkbox points at the error with aria-errormessage". |
| Related fields are grouped under a title.                    | met        | `pl-fieldset` is a `role="group"` named by its legend. Test: "a fieldset is a group named by its legend and described by its description".                                                                                                                       |
| Label beside the control, and trailing for a toggle.         | deviation  | `horizontal` puts the label first; a checkbox or switch puts the control first, as a toggle row reads. Tests: "horizontal puts the label beside the control", "a checkbox or switch field puts the control first".                                               |
| (Platform behavior) Clicking a label acts on its control.    | met        | The field clicks a toggle and focuses any other control, once. Tests: "clicking the label focuses a pl-input", "a checkbox and a switch are named and described by their label, and the label toggles them once".                                                |
| (Platform behavior) Hit areas of at least 44 by 44 on touch. | met        | A toggle's label has `--pl-size-hit-min` as its minimum height; controls keep their own. Test: "the controls and a toggle's label keep a 44 high hit area".                                                                                                      |
| (Platform behavior) Mirrors for right-to-left text.          | met        | Grid areas follow the writing direction. Test: "the field mirrors under rtl".                                                                                                                                                                                    |
| (Platform behavior) Visible under forced colors.             | met        | The error keeps its icon and takes `CanvasText`. Test: "under forced colors the error keeps its icon and system text color".                                                                                                                                     |
| (Platform behavior) Text zoom.                               | met        | Parts wrap with `overflow-wrap: anywhere`. Tests: "no horizontal overflow at 200% text zoom".                                                                                                                                                                    |
| Reduced motion.                                              | met        | Nothing animates. Test: "nothing animates, so reduced motion changes nothing".                                                                                                                                                                                   |
| A disabled group looks inactive.                             | deviation  | Controls dim themselves; the legend and description keep their color, as a native disabled fieldset keeps its legend.                                                                                                                                            |
| Vertical alignment of a control beside multi-line text.      | needs eyes | The control is centered across the label and description rows, except a toggle, which is top-aligned.                                                                                                                                                            |

## Usage guidelines (for `docs/components.md`, not the component)

- Use `pl-field` for native inputs, third-party controls, and `pl-` controls in a custom layout. A `pl-input` with its own slotted label does not need it.
- Slot a `<label>` as the label. Any other element works, and is copied to a `pl-` text control's `label`.
- Do not show both the field's error and the control's own validation message.
- Responsive needs a parent that has a width of its own; the field takes `container-type: inline-size`.
- Slot `pl-field` elements into `pl-fieldset` and give it a legend.

## Findings outside HIG

- A `pl-input` and its siblings hide their edit control in a shadow root, so an id reference cannot reach it. The field writes `aria-description` and `aria-invalid` on that inner control, and watches it because the control rewrites `aria-invalid`. `aria-description` is ARIA 1.3; assistive technology support was not checked (unverified).
- Inside a `pl-input-group` the group also writes `aria-description` from addon text, and can overwrite the field's text. Not resolved.
- A native `<fieldset>` in the shadow root would not disable slotted controls, which are not its descendants (unverified in a browser). `pl-fieldset` sets `disabled` on each control instead, which is visible in the DOM.
- The container query breakpoint is a literal 32rem: a condition cannot read a token.
