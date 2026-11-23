# HIG audit: item

Source: [HIG Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables). Code: `src/components/item/`, `src/surfaces/surfaces.css.ts`, `hig/rules/lists-and-tables.yaml`.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "not stated on the HIG page" are web platform behavior. Nothing was run for this audit; the verdicts come from reading the source, stories and e2e files. The HIG page could not be fetched as text, so the wording is from general knowledge of the page and should be checked against it.

## Library guidelines

| Guideline                                                                    | Verdict    | Evidence                                                                                                                        |
| ---------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A row has a short title and quieter secondary text under it.                 | met        | Title is bold, description uses `--pl-color-muted-foreground` (`item.css.ts:33-50`). Rule lists-and-tables/1 is a rubric check. |
| Leading media, then text, then trailing controls.                            | met        | Slots in that order (`item.ts:41-54`). E2E: "the media sits before the text and the actions after it" (`item.e2e.ts:79`).       |
| Mirrors in right-to-left.                                                    | met        | Flex layout with logical properties only. E2E at `item.e2e.ts:90`. Rule lists-and-tables/5.                                     |
| A row that navigates is one target across its width.                         | met        | The link's `::after` covers the row (`item.css.ts:53-57`). E2E at `item.e2e.ts:31`. Rule lists-and-tables/2.                    |
| Controls in a row stay separate.                                             | met        | The actions are above the cover (`item.css.ts:68-70`). E2E at `item.e2e.ts:47` and `:38`. Rule lists-and-tables/3.              |
| Rows are at least the touch minimum tall.                                    | met        | `min-block-size: var(--pl-touch-min)` (`surfaces.css.ts:100`). E2E at `item.e2e.ts:73`. Rule lists-and-tables/4.                |
| Row text is not cut off.                                                     | met        | `overflow-wrap: anywhere` and `min-inline-size: 0` (`item.css.ts:27-31`). E2E at `item.e2e.ts:111`. Rule lists-and-tables/6.    |
| (Platform behavior) The link is the one tab stop of the row and takes Enter. | met        | A real `a` (`item.ts:44-50`). E2E at `item.e2e.ts:53`.                                                                          |
| (Platform behavior) The focus ring surrounds the row, also in forced colors. | met        | `::after` outline (`item.css.ts:63-66`, `:86-90`). E2E at `item.e2e.ts:60`.                                                     |
| (Platform behavior) The row stays solid.                                     | met        | List row surface has `backdrop-filter: none`. E2E at `item.e2e.ts:102`.                                                         |
| (Platform behavior) Selection, disclosure indicators and swipe actions.      | gap        | Not built in. An app can slot a chevron into `actions`. Not stated on the HIG page as a requirement for every row.              |
| (Platform behavior) Row spacing and type sizes.                              | needs eyes | Padding comes from the list row surface; HIG gives no values.                                                                   |

## Usage guidelines (for `docs/components.md`, not the component)

- Put `role="list"` on the parent and `role="listitem"` on each `pl-item` for a list of rows.
- Give a link row a title that makes sense out of context.
- Do not put a link in the `actions` slot of a link row.

## Not verified

- No test, Storybook or browser was run.
- Row sizes were not compared with a native list.
