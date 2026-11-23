# HIG audit: collapsible

Source: [HIG Disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls). The page text could not be fetched when this audit was written; the rows below come from the page's known subject (a control that shows and hides related content), not from a reading of its wording. Re-read the page and confirm each row. Code: `src/components/collapsible/`, `hig/rules/disclosure-controls.yaml`.

Verdicts: **met**, **gap**, **deviation**, or **needs eyes** (a visual judgement for the maintainer).

## Library guidelines

| Guideline (shortened)                                                    | Verdict    | Evidence                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A disclosure control shows and hides related content (rule 1).           | met        | A native `button` with `aria-expanded` and `aria-controls` toggles the panel (`collapsible.ts`). Test: "the trigger is a button with aria-expanded and aria-controls".                                                                |
| The arrow sits at the leading edge and turns when open (rule 2).         | met        | A chevron before the label points inline-end and turns 90 degrees when open; it mirrors in RTL (`collapsible.css.ts`). Test: "under rtl the chevron mirrors and the content keeps the label's edge".                                  |
| The label says what it reveals, content stays next to it (rule 3).       | met        | Library part only: the content sits directly under the trigger and lines up with the label. Writing a clear label is the app's job.                                                                                                   |
| (Not stated on the page) Motion is short and stops under reduced motion. | met        | Height uses `--pl-duration` and `--pl-ease-out`; reduced motion sets the transitions to `none` and the duration tokens to 0s. Tests: "the height animates with the duration token", "under reduced motion the content shows at once". |
| (Not stated on the page) Closed content is unreachable.                  | met        | The closed panel is `visibility: hidden` after the close finishes, so it leaves the tab order and the accessibility tree. Tests: "closed content is hidden and takes no space".                                                       |
| (Not stated on the page) Forced colors and hit size.                     | met        | The ring is `Highlight`, the chevron `ButtonText`, nothing fades. The trigger is at least `--pl-size-hit-min` high (44px with a coarse pointer).                                                                                      |
| (Not stated on the page) Hover and pressed faces, content inset.         | needs eyes | The faces use `--pl-color-muted-3` and `--pl-color-muted-pressed`; the content inset equals the chevron column. Check against a native disclosure row.                                                                                |

## Usage guidelines (for `docs/components.md`)

- Give the trigger a short label that names what opens.
- Use one collapsible for one block of related content. For a set that opens one at a time, listen to `pl-toggle` and set `open` on the others.
- Do not put critical information only inside closed content.
