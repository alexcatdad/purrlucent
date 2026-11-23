# HIG audit: message

Source: [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left) and [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility). Code: `src/components/message/`. The element is modelled on a chat row; the HIG has no page for it, so the rows below come from those general pages.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer). Rows marked "not stated on the HIG page" are web platform behavior. Nothing was run for this audit; the verdicts come from reading the source, stories and e2e files. The HIG pages could not be fetched as text, so the wording is from general knowledge of the pages and should be checked against them.

## Library guidelines

| Guideline                                                                         | Verdict    | Evidence                                                                                                                                      |
| --------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| The row mirrors in right-to-left; the person's own side follows the writing mode. | met        | Grid columns and margins are logical (`message.css.ts`). E2E: "under rtl the start-aligned avatar sits at the right edge" and the `end` test. |
| The avatar is level with the bottom of the content, above any footer.             | met        | Avatar shares the content's grid row. E2E: "the avatar sits level with the bottom of the content, above the footer".                          |
| Spacing and type come from tokens, so Dynamic Type style scaling reaches the row. | met        | Only `--pl-space-*`, `--pl-text-*` and `--pl-leading-*` tokens. E2E: "long text wraps without horizontal overflow at 200% text zoom".         |
| Content is not cut off at larger text sizes.                                      | met        | `minmax(0, 1fr)`, `min-inline-size: 0` and `overflow-wrap: anywhere`.                                                                         |
| Icon-only controls have a name.                                                   | gap        | The footer cannot check its slotted buttons. The slot docs require an `aria-label` on each. The coarse-pointer test covers the 44 by 44 size. |
| (Platform behavior) A message has no role; a group is a `group` named by `label`. | met        | `PlMessageGroup` sets `role="group"`. E2E: "a message has no role of its own" and "a group is a named group".                                 |
| (Platform behavior) A grouped avatar that is not shown is also hidden from AT.    | met        | `visibility: hidden` keeps the space and removes it from the tree. E2E: "only the last message of a group exposes its avatar".                |
| (Platform behavior) Forced colors.                                                | met        | The row draws no color of its own; the avatar and the slotted bubbles carry their own forced-colors rules.                                    |
| (Platform behavior) Reduced motion.                                               | met        | Nothing animates. E2E: "nothing animates under reduced motion".                                                                               |
| (Platform behavior) Live announcement of new messages.                            | deviation  | Not built in. The scroller or the app owns the live region; a row is static.                                                                  |
| (Platform behavior) Spacing between groups and the maximum bubble width.          | needs eyes | Within a group the gap is `--pl-space-0-5`; the space between groups and the bubble width belong to the page or the bubble.                   |

## Usage guidelines (for `docs/components.md`, not the component)

- Give each `pl-avatar` a `name`, and give `pl-message-group` a `label` with the sender's name.
- Put `align="end"` on every message of the person's own group.
- Give every icon-only button in `footer` an `aria-label`.
- Render markdown outside the message and slot the result in.

## Not verified

- No test, Storybook or browser was run.
- Avatar-to-bubble spacing was not compared with a native Messages row.
