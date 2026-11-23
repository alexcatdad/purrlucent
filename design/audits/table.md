# HIG audit: table and data-table

Source: [HIG Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables), read 2026-11-23. Code: `src/components/table/`, `src/components/data-table/`, `hig/rules/lists-and-tables.yaml`.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Platform behavior the page does not state is marked as such.

## Library guidelines

| Guideline (HIG wording, shortened)                                                | Verdict   | Evidence                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prefer a list or table for text; rows are easy to scan.                           | met       | Both components draw a native `<table>` of rows (`table.css.ts`, `data-table.ts`). Rule lists-and-tables/7 is a rubric rule.                                                                                    |
| Give appropriate feedback when an item is selected.                               | met       | A selected row gets a `--pl-color-selected` fill and its checkbox shows the state, so color is not the only cue (`data-table.ts`, `table.css.ts`). Test: "a selected row is marked by its checkbox and a fill". |
| Keep text readable where it may be clipped or wrapped.                            | deviation | Cells wrap (`overflow-wrap: anywhere`) and never truncate, so there is no middle ellipsis. Wrapping keeps all text reachable; no horizontal overflow at 200% zoom is tested.                                    |
| Column headings are nouns or short noun phrases, title-style, no end punctuation. | usage     | The app writes the headings; the component only renders `label`.                                                                                                                                                |
| (macOS) Click a column heading to sort; clicking again reverses.                  | met       | A heading is a button in its `th`; ascending first, then reverse (`data-table.ts` `#sort`). Test: "a click sorts ascending, a second click reverses, and pl-sort reports it".                                   |
| (macOS) Let people resize columns.                                                | gap       | Not built. Columns size to their content.                                                                                                                                                                       |
| (macOS) Consider alternating row colors in wide multicolumn tables.               | gap       | Not built; each row has a hairline separator instead (`table.css.ts`).                                                                                                                                          |
| (macOS) Use an outline view for hierarchical data.                                | usage     | These are flat tables; use a tree for hierarchy.                                                                                                                                                                |
| Let people edit a table, such as reordering.                                      | gap       | Neither component edits or reorders rows.                                                                                                                                                                       |
| Platform behavior (not stated on HIG): the scroll area is keyboard reachable.     | met       | `pl-table` takes `tabindex=0` and `role=region` with a name only while it overflows (`table.ts`). Test: "an overflowing table is a named region the keyboard reaches and scrolls".                              |
| Platform behavior (not stated on HIG): focus ring on a heading button.            | met       | `th button:focus-visible` draws the ring; forced colors use `Highlight` (`data-table.css.ts`).                                                                                                                  |
| Platform behavior (not stated on HIG): touch targets.                             | met       | Heading buttons use `--pl-size-hit-min`, 44px under a coarse pointer (`data-table.css.ts`). Test: "a heading button is at least 44 high".                                                                       |

## Usage guidelines

- Write headings as nouns in title-style capitalization (lists-and-tables/10).
- Name a table with a caption or `label`; an overflowing scroll area with neither has no name.
- Use a collection, not a table, for items of widely varying size or many images.
- Do not add `role=grid` to a static table.

## Findings outside HIG

- There is no virtualization; every row is rendered.
- Sorting is by value for numbers and a numeric-aware locale compare for text; `manual-sort` leaves order to the app.
