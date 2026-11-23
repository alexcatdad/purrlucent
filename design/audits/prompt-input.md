# HIG audit: prompt input

Source: [HIG Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields), as read for `design/audits/input-group.md` (change log: June 5, 2023). Code: `src/components/prompt-input/`, built from `pl-input-group`, `pl-textarea` and `pl-button`. The HIG has no page for a chat composer; the rows below apply the text field and accessibility guidance to it, and the rest is platform behavior checked against native messaging fields and the web platform.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer).

## Library guidelines

| Guideline (HIG wording, shortened)                            | Verdict    | Evidence                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every field has a label; placeholder text alone is not it.    | met        | The field is always named: `label`, else a native `<label for>`, else "Message". The label is not shown; a placeholder is optional. Test: "the field is named Message and a label attribute renames it".                                                       |
| Use a text area for longer text.                              | met        | The field is a `pl-textarea` that grows with its text up to about eight lines, then scrolls. Test: "the field grows with its text, stops at a maximum, scrolls, and shrinks again".                                                                            |
| (Platform behavior) Return sends; a newline needs a modifier. | met        | Enter sends, Shift+Enter inserts a newline, and Enter that confirms an IME composition never sends. Tests: "Enter sends the trimmed text and clears the field", "Shift+Enter inserts a newline and sends nothing", "Enter during IME composition never sends". |
| (Platform behavior) Nothing to send, nothing to press.        | met        | Send is off while the text is empty or whitespace, and Enter then sends nothing. Tests: "Send is off while the text is empty or only whitespace", "Enter on whitespace sends nothing and adds no newline".                                                     |
| (Platform behavior) A running action can be stopped.          | met        | While `busy` the button is named Stop and fires `pl-stop`; the field stays editable. Test: "while busy the button is Stop, fires pl-stop, and Enter sends nothing".                                                                                            |
| Hit areas of at least 44 by 44 on touch.                      | met        | The field is the large size and the send button the medium size, both of which grow on a coarse pointer; slotted tools are `pl-button`s with their own minimum. Test: "every control keeps a 44 by 44 hit area".                                               |
| (Platform behavior) Mirrors for right-to-left text.           | met        | Tools use `start` and `end` slots and logical properties only. Test: "the tools mirror under rtl".                                                                                                                                                             |
| (Platform behavior) Takes part in forms.                      | met        | Submits `name` with its text, is invalid while empty and `required`, and returns to its `value` attribute on reset. Test: "the form gets the text under its name, validity and reset".                                                                         |
| (Platform behavior) Native input and change events.           | met        | `pl-input` and `pl-change` are each followed by the native `input` and `change`; the inner field's own events are stopped, so none fire twice. Test: "editing fires each pl-* event with its native event after it, and none twice".                           |
| Focus is clearly visible; forced colors and reduced motion.   | met        | The group draws one ring and a solid border under forced colors, and its transitions use duration tokens that are 0 under reduced motion. Test: "the controls keep a border under forced colors and the motion stops under reduced motion".                    |
| Tools stay beside the text being typed.                       | needs eyes | Tools align to the field's bottom edge, so they sit beside the last line while it grows. Whether bottom or top reads better with a very tall field is a visual call.                                                                                           |

## Usage guidelines (for `docs/components.md`, not the component)

- Listen for `pl-submit` (cancelable, `detail.value` is trimmed). The field clears unless the event is prevented, so keep the text while a request that can fail is sent. The element does not submit its form.
- Set `busy` while a reply streams and listen for `pl-stop`. Enter sends nothing while busy.
- Give an icon-only tool in `start` or `end` an `aria-label`. Put the attach button in `start` and a model picker in `end`.
- The elements never parse the text they send; render a reply with your own markdown.

## Findings outside HIG

- The component sets the native textarea's height from its `scrollHeight` through the textarea's `shadowRoot`, because the textarea's `[part="control"]` is a fixed height. The cap is `max-block-size` on that part, derived from `--pl-leading-normal` and `--pl-space-1`.
- The field height is re-measured when the text or the field's width changes. A change of font size with the same width and text is not observed (unverified).
- The send and stop labels are English and fixed ("Send", "Stop").
