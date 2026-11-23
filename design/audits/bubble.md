# HIG audit: bubble

HIG has no page for a chat bubble. The guidance used is the library's existing rules for [Color](https://developer.apple.com/design/human-interface-guidelines/color), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left) and [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) (`hig/rules/color.yaml`, `accessibility.yaml`, `right-to-left.yaml`, `buttons.yaml`). The pages were not re-read for this audit and nothing was run: no tests, no Storybook, no browser. The verdicts come from reading the source, stories and e2e files. Code: `src/components/bubble/`.

Verdicts: **met**, **gap**, **deviation** (deliberate, with a reason), or **needs eyes** (a visual judgement for the maintainer).

Components: `pl-bubble`, `pl-bubble-reactions`, `pl-bubble-group`.

## Library guidelines

| Guideline                                                     | Verdict    | Evidence                                                                                                                                                                                                                                    |
| ------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text meets contrast on every fill.                            | met        | Each variant pairs its fill with the foreground token made for it (`bubble.css.ts`, `--_fill` and `--_fg`). `src/quality.e2e.ts` measures every story's text from pixels in light and dark, including the `Variants` and `Glass` stories.   |
| Color is not the only cue; destructive says so in text.       | met        | The destructive variant adds an error mark beside the text, and the story's message says what failed. Test: "destructive draws an error mark beside text that says what failed". The text itself is the app's.                              |
| Controls have a visible focus ring, also under forced colors. | met        | `[part="body"]:focus-visible` draws the ring; forced colors use `Highlight` (`bubble.css.ts`). Tests: "a link and a button show a focus ring", "the focus ring is visible under forced colors".                                             |
| Controls are at least 44 by 44 on a coarse pointer.           | met        | A link or button body and a slotted reaction button use `--pl-size-hit-min`. Test: "a link, a button and a reaction button are at least 44 by 44".                                                                                          |
| A control does not hold another control.                      | met        | Reactions are a sibling of the link or button body, never inside it (`bubble.ts` render).                                                                                                                                                   |
| Reactions have one name that summarizes them, or are buttons. | met        | `role="img"` with an `aria-label` from `label` or the text; with `interactive`, `role="group"` over real buttons. Tests: "non-interactive reactions are one image named by the label", "interactive reactions are a group of real buttons". |
| Layout mirrors in right-to-left.                              | met        | `align`, reaction `align` and the corner radii use logical properties. Test: "under rtl the start edge is at the right".                                                                                                                    |
| Text wraps at larger text sizes.                              | met        | Content wraps (`overflow-wrap: anywhere`) and the bubble stops at 80%. Test: "no horizontal overflow at 200% text zoom".                                                                                                                    |
| Nothing moves with reduced motion.                            | met        | The only transition is the hover tint, and it takes `--pl-duration-fast`, which is `0s` under reduced motion. Test: "with reduced motion the hover tint does not transition".                                                               |
| Forced colors keep the bubble's shape.                        | met        | Every body has a 1px border that forced colors turns into `CanvasText`; `ghost` stays unframed. Test: "under forced colors a filled bubble keeps an edge".                                                                                  |
| Corner shape and the 80% maximum.                             | needs eyes | The radius is twice `--pl-radius-lg`, and neighbors in a group use `--pl-radius`. The maximum is `80%`, a share of the container, so it is not a token; `--pl-bubble-max-inline-size` overrides it. Both are visual calls.                  |
| Reaction pill size and overlap.                               | needs eyes | Half of the pill overlaps the edge. It is `--pl-visual-md` tall, or `--pl-size-hit-min` when interactive, so on touch the pill is 44px tall.                                                                                                |

## Usage guidelines

- Use `default` for the person's own messages with `align="end"`, `secondary` or `ghost` for the other side. Use `ghost` for assistant text, rendered markdown and code; the bubble never parses markdown.
- Write what went wrong in a destructive bubble; the error mark is not the message.
- Give non-interactive reactions a `label` such as "2 likes, 1 laugh"; without one the text is read as it is, emoji included.
- An interactive reaction is a `button` with its own `aria-label`.
- A link or button bubble holds text only; put other controls outside it.

## Findings outside HIG

- `pl-bubble-group` does not set `align`; each bubble keeps its own.
- A bubble's link or button holds the content as inline text; block content (lists, code) belongs in a `ghost` bubble that is not a control.
