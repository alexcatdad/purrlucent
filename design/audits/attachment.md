# HIG audit: attachment

Sources: [HIG Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables), [Scroll views](https://developer.apple.com/design/human-interface-guidelines/scroll-views), [Loading](https://developer.apple.com/design/human-interface-guidelines/loading), [Color](https://developer.apple.com/design/human-interface-guidelines/color). Code: `src/components/attachment/`.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "not stated on the HIG page" are web platform behavior. Nothing was run for this audit; the verdicts come from reading the source, stories and e2e files. The HIG pages could not be fetched as text, so the wording is from general knowledge of the pages and should be checked against them.

## Library guidelines

| Guideline                                                                     | Verdict    | Evidence                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leading media, then text, then trailing controls; mirrored in right-to-left.  | met        | Slots in that order, logical properties only. E2E: "the media sits before the text and the actions after it", "under rtl the media sits at the right edge".           |
| A card that navigates is one target across its width with a single tab stop.  | met        | The trigger's `::after` covers the card. E2E: "a click anywhere on a link card follows the link", "a link card has one tab stop for the link and one for the action". |
| Controls on the card stay separate targets.                                   | met        | Actions are positioned above the cover. E2E: "clicking the action does not follow the link", "the action does not fire pl-press".                                     |
| Targets are at least 44 by 44 points on touch.                                | met        | Link and clickable cards have `min-block-size: var(--pl-touch-min)`; actions are `pl-button icon`. E2E: coarse pointer describe block.                                |
| Work in progress is shown, and not by motion alone.                           | met        | The shimmer dims a band across the title; a hidden status word and `aria-busy` carry the state. E2E: states tests.                                                    |
| Motion stops when the person asks for less.                                   | met        | The mask and animation are removed under `prefers-reduced-motion`. E2E: "under reduced motion the shimmer stops".                                                     |
| An error is not told by color alone.                                          | met        | The reason is in the description text; the hidden status word says "Error"; forced colors draw a dashed edge. E2E: error tests.                                       |
| Text colors keep their contrast on the card surface.                          | met        | Foreground, muted foreground and destructive-text tokens made for the surface. Axe tests on states.                                                                   |
| Card text wraps instead of being cut off.                                     | met        | `overflow-wrap: anywhere`, `min-inline-size: 0`. E2E at 200% text zoom.                                                                                               |
| A scrolling row shows that there is more, and the keyboard can scroll it.     | met        | Edge fades per side; the row takes a tab stop when it overflows and holds nothing focusable. E2E: group tests.                                                        |
| (Platform behavior) The focus ring surrounds the card, also in forced colors. | met        | `::after` outline, `Highlight` under forced colors. E2E: "the focus ring is visible on the card, also under forced colors".                                           |
| (Platform behavior) The card stays solid under glass.                         | met        | `backdrop-filter: none`. E2E: "the card stays solid under glass".                                                                                                     |
| (Platform behavior) Removing, retrying or cancelling an upload.               | gap        | Not built in. An app slots an action button and names it. The component offers no progress value; the app writes the progress into the description.                   |
| (Platform behavior) Card size, padding and corner radius.                     | needs eyes | Values derive from spacing and radius tokens; HIG gives none.                                                                                                         |
| (Platform behavior) The fade width and the mask look.                         | needs eyes | One token multiple (`--pl-space-8`); a visual judgement.                                                                                                              |

## Usage guidelines (for `docs/components.md`, not the component)

- Name each action button for the action and the attachment, for example `aria-label="Remove report.pdf"`.
- Keep the failure reason in the description of an `error` card.
- Set `status-label` when the page is not in English.
- Give `pl-attachment-group` a `label`.
- Do not put a link or a clickable card inside the `actions` slot of a link or clickable card.

## Not verified

- No test, Storybook or browser was run.
- The shimmer was not compared with a native progress look.
