# HIG audit: checkbox (pilot)

Source: [HIG Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles), read 2026-11-22 (change log: March 29, 2024). Code: `src/components/checkbox/`, `src/behaviors/pressable.ts`, `hig/rules/toggles.yaml`.

Each guideline is either **library** (the component decides it) or **usage** (the app author decides it, so it belongs in the docs). Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer).

## Library guidelines

| Guideline (HIG wording, shortened)                                                              | Verdict    | Evidence                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A small, square button: empty when off, a checkmark when on, a dash when mixed.                 | met        | `checkbox.ts:126-129` draws the check and dash paths; `checkbox.css.ts` shows the dash only for `:state(indeterminate)`.                                                                                                                                                                                |
| Typically includes a title on its trailing side; can appear without one.                        | met        | The label slot follows the box; `:not(:state(labelled))` centers the box alone. The `Rtl` story covers the trailing side in right-to-left.                                                                                                                                                              |
| Make the visual differences between states obvious; don't rely on color alone.                  | met        | On adds a fill and a glyph, mixed a fill and a dash, so state reads without color. Forced colors keep a border and a Highlight fill (`checkbox.css.ts`, forced-colors block).                                                                                                                           |
| Accurately reflect the state: on, off or mixed.                                                 | met        | `aria-checked` is `true`, `false` or `mixed` (`checkbox.ts:98-101`). Rule toggles/5 has a test: a click on a mixed box makes it checked.                                                                                                                                                                |
| Checkboxes align along the leading edge so they communicate grouping and hierarchy.             | needs eyes | The box is the first item of an inline-flex row, so stacked checkboxes share a leading edge. Indentation for subordinate checkboxes is left to the app; no story shows a hierarchy.                                                                                                                     |
| (Platform behavior) Space toggles a focused checkbox; Return belongs to the default button.     | met        | The checkbox passes `enter: false` to `PressableController` (`checkbox.ts:50`), so Space toggles and Enter is left to the form, as with a native checkbox. Test: `checkbox.e2e.ts` "Enter does not toggle the box, as with a native checkbox".                                                          |
| (Platform behavior) A multi-line title keeps the box beside its first line.                     | met        | `boxStyles` sets `align-items: flex-start` on the host and centers the box on the first line of the label (`checkbox.css.ts:21`, `56`). Test: `checkbox.e2e.ts` "with a wrapping label the box stays beside the first line". Not stated on the Toggles page; it is how native macOS checkboxes lay out. |
| (Typography) Control titles use the regular weight of the system font at the control text size. | met        | The label is `font: 400 var(--pl-text-sm)`, regular weight, per `design/decisions.md` item 1. Not stated on the Toggles page.                                                                                                                                                                           |
| Sizes                                                                                           | needs eyes | Boxes are 16, 20 and 24px for md, lg and xl (`checkbox.css.ts:12-43`) after PR 8. HIG gives no sizes; the question is whether md looks like a regular macOS checkbox next to 13px text.                                                                                                                 |

## Usage guidelines (for `docs/components.md`, not the component)

- Use a checkbox for two opposing values that affect state; for a choice from a list, use a select (toggles/1).
- Prefer a checkbox over a switch for a single setting, and to show a hierarchy of settings; don't swap an existing checkbox for a switch (toggles/4, toggles/9).
- When a parent checkbox turns subordinate ones on and off, set it to mixed when they differ.
- Introduce a group whose relationship is unclear with a label, its baseline aligned with the first checkbox (toggles/6). With this library that is a `fieldset` and `legend` around the checkboxes; there is no checkbox-group component.
- Use checkboxes in the window body, not in a toolbar or status bar.

## Findings outside HIG

- The `required` validation message is the browser's own, localized one, borrowed from a native checkbox (`nativeMessage`, `src/behaviors/native-message.ts`), per `design/decisions.md` item 6. Test: `checkbox.e2e.ts` "the required message is the browser's own, localized one".

## Source of truth

`src/tokens/tokens.css` is the source of truth for sizes, radii, spacing and colors (decided 2026-11-22). `design/visual-spec.md` has no checkbox section and is superseded where it differs from the tokens.
