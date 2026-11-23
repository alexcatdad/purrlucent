# HIG audit: separator, kbd and badge

Sources: [HIG Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards) and [HIG Color](https://developer.apple.com/design/human-interface-guidelines/color). Code: `src/components/separator/`, `src/components/kbd/`, `src/components/badge/`, `hig/rules/keyboards.yaml`, `hig/rules/color.yaml`.

HIG has no page for a separator or a badge component. The page text could not be fetched on 2026-11-23 (the pages render with script; the fetch returned only titles), so the rows below rest on the rules already in `hig/rules/` and on web standards. Verdicts: **met**, **gap**, **deviation**, or **needs eyes**.

## Separator (`pl-separator`)

| Guideline                                                                           | Verdict    | Evidence                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A separator uses the separator color, never as a fill.                              | met        | A 1px border in `--pl-color-border` (`separator.css.ts:14`). E2E: "the line uses the border token". Rule color/10.                                                                                                   |
| (WAI-ARIA) Decorative rule is hidden; a real one is a `separator` with orientation. | met        | `role="none"` by default, `role="separator"` with `aria-orientation` when `semantic` (`separator.ts:30-39`). E2E: "by default it is decoration with role none", "semantic sets role separator and aria-orientation". |
| (Platform behavior) Mirrors in right-to-left.                                       | met        | Logical border properties (`separator.css.ts:14,28`). E2E: "under rtl a vertical rule still sits between the words".                                                                                                 |
| (Platform behavior) Forced colors keep the line.                                    | met        | Border color `CanvasText` (`separator.css.ts:32-36`). E2E: "the line keeps a visible color under forced colors".                                                                                                     |
| (Platform behavior) Increased contrast.                                             | needs eyes | The border token has a stronger value under increased contrast (`tokens.css`); the `Glass` story shows it. Not measured.                                                                                             |

## Kbd (`pl-kbd`)

| Guideline                                                                   | Verdict     | Evidence                                                                                                                                                                                                    |
| --------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shortcut modifiers are listed in the order Control, Option, Shift, Command. | met (usage) | The element shows the text it is given; the `Shortcut` story and the JSDoc show the order (`kbd.ts:5-8`). E2E: "a shortcut keeps modifiers in the order Control, Option, Shift, Command". Rule keyboards/9. |
| (Platform behavior) Purely presentational, no focus.                        | met         | No tabindex, no role, `user-select: none` (`kbd.css.ts`). E2E: "it takes no focus".                                                                                                                         |
| (Platform behavior) Forced colors keep the keycap edge.                     | met         | System colors in `kbd.css.ts` forced-colors block. E2E: "the keycap keeps its edge under forced colors".                                                                                                    |
| (Platform behavior) Text contrast.                                          | met         | `--pl-color-foreground` on `--pl-color-muted-2`; both are covered by the token contrast test (color/2).                                                                                                     |
| Shift is not added to a key that already needs Shift.                       | needs eyes  | The author writes the text; the component cannot check it. Rubric rule keyboards/6.                                                                                                                         |

## Badge (`pl-badge`)

| Guideline                                        | Verdict    | Evidence                                                                                                                         |
| ------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Color is never the only carrier of meaning.      | met        | The text is the content; variants only change color (`badge.ts:5-9`). E2E: "each variant says its status in text". Rule color/9. |
| Each color pairs with a legible foreground.      | met        | Fill and foreground tokens in pairs (`badge.css.ts:34-42`). E2E: "the text meets 4.5:1 against the fill in every variant".       |
| One color keeps one meaning.                     | met        | Only `accent` and `destructive` use status hues; no other status tokens exist, so there are no success or warning variants.      |
| (Platform behavior) Presentational, no focus.    | met        | No tabindex or role. E2E: "it takes no focus".                                                                                   |
| (Platform behavior) Forced colors keep the edge. | met        | `ButtonText` border (`badge.css.ts` forced-colors block). E2E: "the badge keeps an edge under forced colors".                    |
| (Platform behavior) Sizes.                       | needs eyes | One size, from `--pl-leading-normal` and `--pl-space-1`. HIG gives no sizes.                                                     |

## Findings outside HIG

- A badge that reports a count is not a live region. An app that needs the change announced puts the badge inside its own live region.
- `semantic` is the inverse of shadcn's `decorative`; a boolean attribute that defaults to true cannot be turned off in HTML.

## Not verified

- Nothing was run in a browser; the e2e results above are read from the test files, not executed.
- HIG pages were not readable, so no guideline text was compared.
