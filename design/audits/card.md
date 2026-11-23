# HIG audit: card

Source: [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials). HIG has no card page, so the card follows the materials guidance that content stays solid and materials belong to the layer above it. Code: `src/components/card/`, `hig/rules/materials.yaml`.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "not stated on the HIG page" are web platform behavior. Nothing was run for this audit; the verdicts come from reading the source, stories and e2e files. The HIG page could not be fetched as text, so the wording is from the existing rule files.

## Library guidelines

| Guideline                                                                                   | Verdict    | Evidence                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A surface that holds content stays solid; materials are for the floating layer.             | met        | `backdrop-filter: none` and a solid `--pl-color-background` (`card.css.ts:14-15`). E2E: "the card stays solid under glass" (`card.e2e.ts:83`); the `Glass` story. Rule materials/8.                   |
| Header, content and footer are grouped under one edge.                                      | met        | A hairline border and `--pl-radius-lg` (`card.css.ts:16-17`); the three sections are in `card.ts:36-45`.                                                                                              |
| A section with nothing in it takes no space.                                                | met        | `#sync` toggles `hidden` on each section from its assigned nodes (`card.ts:22-33`). The card pads and spaces its sections once, so a hidden section leaves no gap. E2E at `card.e2e.ts:27` and `:41`. |
| (Platform behavior) The card is not interactive.                                            | met        | No role, no tabindex; slotted controls keep their own tab stops. E2E at `card.e2e.ts:53`. Not stated on the HIG page.                                                                                 |
| (Platform behavior) Header actions sit at the trailing edge and mirror under right-to-left. | met        | A two-column grid with the actions in the second column (`card.css.ts:28-34`). E2E at `card.e2e.ts:65` and `:74`.                                                                                     |
| (Platform behavior) Text wraps and stays inside the card at 200% text zoom.                 | met        | `overflow-wrap: anywhere` on the content and slotted headings (`card.css.ts:38`, `:71`). E2E at `card.e2e.ts:91`.                                                                                     |
| (Platform behavior) Forced colors keep the edge.                                            | met        | `border-color: CanvasText` (`card.css.ts:76`).                                                                                                                                                        |
| (Platform behavior) Spacing and type sizes.                                                 | needs eyes | Padding is `--pl-space-4`; the title is `--pl-text-base`, bold. HIG gives no values.                                                                                                                  |

## Usage guidelines (for `docs/components.md`, not the component)

- Use a heading element in the `title` slot when the card names a region of the page.
- Keep one primary action per card.
- Do not nest a card in a card.

## Not verified

- No test, Storybook or browser was run.
- Visual spacing was not compared with a native app.
